"""Fetch verified CDEC reservoir storage observations for the static Flood Watch page."""
import csv, io, json, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

STATIONS = {"SHA": "Shasta Lake", "ORO": "Lake Oroville", "FOL": "Folsom Lake"}
# CDEC daily sensor 15 reports reservoir storage in acre-feet.
BASE = "https://cdec.water.ca.gov/dynamicapp/req/CSVDataServlet"
results = []
for station, name in STATIONS.items():
    end = datetime.now(timezone.utc).date() + timedelta(days=1)
    start = end - timedelta(days=14)
    url = f"{BASE}?Stations={station}&SensorNums=15&dur_code=D&Start={start}&End={end}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CaliforniaFloodWatch/0.1"})
        with urllib.request.urlopen(req, timeout=25) as response:
            content = response.read().decode("utf-8-sig")
        observations = []
        for row in csv.DictReader(io.StringIO(content)):
            date = (row.get("DATE TIME") or "").strip()
            value = (row.get("VALUE") or "").strip()
            try:
                storage = float(value)
                if storage >= 0 and date:
                    observations.append({"observed_at": date, "storage_af": storage})
            except ValueError:
                continue
        observations.sort(key=lambda r: r["observed_at"])
        if not observations:
            raise ValueError("No valid observations")
        latest = observations[-1]
        previous = observations[-2] if len(observations) > 1 else None
        week = observations[-8] if len(observations) >= 8 else None
        results.append({"station_id": station, "name": name, **latest,
                        "change_1d_af": round(latest["storage_af"]-previous["storage_af"]) if previous else None,
                        "change_7d_af": round(latest["storage_af"]-week["storage_af"]) if week else None,
                        "source_url": url, "status": "ok"})
    except Exception as exc:
        results.append({"station_id": station, "name": name, "status": "unavailable", "error": str(exc)[:140]})
if not any(r["status"] == "ok" for r in results):
    raise SystemExit("No reservoir readings retrieved; preserving last good snapshot")
output = {"generated_at": datetime.now(timezone.utc).isoformat(), "source": "California Data Exchange Center (CDEC), daily sensor 15", "reservoirs": results}
path = Path("flood-watch/data/reservoirs.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(output, indent=2) + "\n")
print(f"Saved {sum(r['status']=='ok' for r in results)} reservoir readings")
