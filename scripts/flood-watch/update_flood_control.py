"""Parse official USACE FCR report. Fail closed if report layout changes."""
import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

URL = "https://www.spk-wc.usace.army.mil/fcgi-bin/midnight.py?days=0&report=FCR"
req = urllib.request.Request(URL, headers={"User-Agent": "CaliforniaFloodWatch/0.3"})
with urllib.request.urlopen(req, timeout=30) as response:
    raw = response.read().decode("utf-8", errors="replace")
# Report is rendered as fixed-width text in HTML. Keep line boundaries.
text = html.unescape(re.sub(r"<[^>]+>", "", raw))
if "Flood Control Requirements" not in text or "Top of" not in text:
    raise SystemExit("USACE FCR header not found; preserving last snapshot")
date_match = re.search(r"Data Ending\s+2400 hours\s+(\d{1,2}\s+[A-Z]{3}\s+\d{4})", text)
if not date_match:
    raise SystemExit("USACE report date missing")
report_date = datetime.strptime(" ".join(date_match.group(1).split()), "%d %b %Y").date()
if (datetime.now(timezone.utc).date() - report_date).days > 7:
    raise SystemExit("USACE report stale; preserving last snapshot")
# Restrict to Sacramento Valley so similarly named rows elsewhere cannot be matched.
section = text.split("---- Sacramento Valley ----", 1)
if len(section) != 2:
    raise SystemExit("Sacramento Valley section missing")
section = section[1].split("BASIN TOTALS", 1)[0]
number = r"([\d,]+)"
pattern = re.compile(r"^\s*(Shasta|Oroville):\s+" + number + r"\s+" + number + r"\s+" + number + r"\s+\d+\s+(-?[\d,]+)\s*\(\s*\d+\)", re.M)
stations = {}
for match in pattern.finditer(section):
    name, gross, target, actual, difference = match.groups()
    gross, target, actual, difference = [int(x.replace(",", "")) for x in (gross, target, actual, difference)]
    if not (0 < target <= gross * 1.01 and 0 <= actual <= gross * 1.1 and abs(actual-target-difference) <= 2):
        raise SystemExit("USACE values inconsistent for " + name)
    stations[name] = {"gross_capacity_af": gross, "top_conservation_af": target,
                      "actual_storage_af": actual, "above_target_af": difference,
                      "room_to_target_af": max(0, target-actual),
                      "encroachment_af": max(0, difference), "status": "ok"}
# Folsom uses a separate forecast-dependent row and may not report a current target.
folsom = re.search(r"^\s*Folsom:\s+" + number, section, re.M)
if folsom:
    stations["Folsom Lake"] = {"status": "unavailable", "reason": "Variable forecast-based target requires separate validated parsing"}
if not all(k in stations for k in ("Shasta", "Oroville")):
    raise SystemExit("Required reservoir target rows missing")
output = {"generated_at": datetime.now(timezone.utc).isoformat(), "report_date": str(report_date),
          "source_url": URL, "source": "USACE Sacramento District Flood Control Requirements",
          "interpretation": "Top of conservation is a maximum operating target, not total physical empty capacity.",
          "reservoirs": stations}
path = Path("flood-watch/data/flood_control.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(output, indent=2) + "\n")
print("Parsed official flood-control targets for", ", ".join(stations))
