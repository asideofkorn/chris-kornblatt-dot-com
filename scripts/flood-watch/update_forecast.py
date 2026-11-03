"""Retrieve NWS forecast periods for Sacramento as a regional reference, not a statewide forecast."""
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HEADERS = {"User-Agent": "CaliforniaFloodWatch/0.2 (public research dashboard)", "Accept": "application/geo+json"}
def get_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)

# Representative location only. Forecasts are NOT watershed averages.
point = get_json("https://api.weather.gov/points/38.5816,-121.4944")
forecast_url = point["properties"]["forecast"]
forecast = get_json(forecast_url)
periods = []
for p in forecast["properties"].get("periods", []):
    periods.append({
        "name": p.get("name"), "start_time": p.get("startTime"),
        "end_time": p.get("endTime"), "temperature_f": p.get("temperature"),
        "precipitation_probability_pct": (p.get("probabilityOfPrecipitation") or {}).get("value"),
        "short_forecast": p.get("shortForecast"),
        "detailed_forecast": p.get("detailedForecast")
    })
if not periods:
    raise SystemExit("No NWS forecast periods; retaining previous forecast")
output = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "issued_at": forecast["properties"].get("generatedAt"),
    "updated_at": forecast["properties"].get("updateTime"),
    "location": "Sacramento, CA (representative point; not statewide)",
    "source": "National Weather Service",
    "source_url": forecast_url,
    "periods": periods
}
path = Path("flood-watch/data/forecast.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(output, indent=2) + "\n")
print("Saved", len(periods), "NWS forecast periods")
