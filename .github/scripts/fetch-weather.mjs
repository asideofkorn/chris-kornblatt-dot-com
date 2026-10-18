// Saves race-day wind for the bike course: observed at Sacramento Executive Airport (NWS station KSAC)
// and modeled hourly by Open-Meteo at the north and south ends of the bike course. Public weather data only.
// Usage: node fetch-weather.mjs out/weather.json
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] || "weather.json";
const DAY = "2026-10-18";
const result = { fetchedAt: new Date().toISOString(), day: DAY, station: null, model: {} };

async function json(url, headers = {}) {
  const r = await fetch(url, { headers: { "User-Agent": "chriskornblatt.com race charts (chris.kornblatt@gmail.com)", Accept: "application/geo+json, application/json", ...headers } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// NWS observations come in km/h and degrees; keep mph and the direction the wind blows FROM.
try {
  const j = await json(`https://api.weather.gov/stations/KSAC/observations?start=${DAY}T13:00:00Z&end=2026-10-19T09:00:00Z&limit=500`);
  const kmhToMph = (v) => (v == null ? null : Math.round(v * 0.621371 * 10) / 10);
  result.station = {
    id: "KSAC", name: "Sacramento Executive Airport", lat: 38.507, lng: -121.495,
    obs: (j.features || []).map((f) => f.properties).map((p) => ({
      t: p.timestamp, speed: kmhToMph(p.windSpeed?.value), gust: kmhToMph(p.windGust?.value), dir: p.windDirection?.value ?? null,
      tempF: p.temperature?.value == null ? null : Math.round((p.temperature.value * 9 / 5 + 32) * 10) / 10,
    })).filter((o) => o.speed != null).sort((a, b) => a.t.localeCompare(b.t)),
  };
} catch (e) { console.log("NWS:", e.message); }

const points = { north: [38.4956, -121.5594], south: [38.2914, -121.6309] }; // bike mats BIKE1 and BIKE4
for (const [name, [lat, lng]] of Object.entries(points)) {
  try {
    const j = await json(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&start_date=${DAY}&end_date=${DAY}`);
    const h = j.hourly || {};
    result.model[name] = { lat, lng, hours: (h.time || []).map((t, i) => ({ t, speed: h.wind_speed_10m[i], dir: h.wind_direction_10m[i], gust: h.wind_gusts_10m[i], tempF: h.temperature_2m[i] })) };
  } catch (e) { console.log("Open-Meteo", name, e.message); }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result));
console.log(`${out}: station obs ${result.station?.obs.length ?? 0}, model ${Object.keys(result.model).join(", ") || "none"}`);
