"""Fetch CDEC daily reservoir inflow/outflow; missing readings remain unavailable."""
import csv
import io
import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

STATIONS = {"SHA": "Shasta Lake", "ORO": "Lake Oroville", "FOL": "Folsom Lake"}
# CDEC sensor 76: reservoir inflow (cfs); sensor 23: reservoir outflow (cfs).
# These are requested as DAILY values; CDEC station/sensor availability varies.
SENSORS = {"inflow_cfs": 76, "outflow_cfs": 23}
BASE = "https://cdec.water.ca.gov/dynamicapp/req/CSVDataServlet"

def observations(station, sensor):
    end = datetime.now(timezone.utc).date() + timedelta(days=1)
    start = end - timedelta(days=15)
    url = f"{BASE}?Stations={station}&SensorNums={sensor}&dur_code=D&Start={start}&End={end}"
    req = urllib.request.Request(url, headers={"User-Agent": "CaliforniaFloodWatch/0.2"})
    with urllib.request.urlopen(req, timeout=25) as response:
        rows = csv.DictReader(io.StringIO(response.read().decode("utf-8-sig")))
        values = []
        for row in rows:
            try:
                value = float((row.get("VALUE") or "").strip())
                date = (row.get("DATE TIME") or "").strip()
                if date and 0 <= value < 1000000:
                    values.append({"observed_at": date, "value_cfs": value})
            except (ValueError, TypeError):
                continue
    values.sort(key=lambda r: r["observed_at"])
    return {"status": "ok" if values else "unavailable", "source_url": url,
            "latest": values[-1] if values else None, "history": values[-14:]}

output = {"generated_at": datetime.now(timezone.utc).isoformat(),
          "source": "California Data Exchange Center (CDEC) daily readings",
          "stations": []}
valid = 0
for station, name in STATIONS.items():
    result = {"station_id": station, "name": name}
    for key, sensor in SENSORS.items():
        try:
            result[key] = observations(station, sensor)
            valid += result[key]["status"] == "ok"
        except Exception as exc:
            result[key] = {"status": "unavailable", "latest": None, "history": [],
                           "error": str(exc)[:120]}
    output["stations"].append(result)
if valid == 0:
    raise SystemExit("No verified flow readings; preserving last successful file")
path = Path("flood-watch/data/flows.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(output, indent=2) + "\n")
print("Verified flow series:", valid)
