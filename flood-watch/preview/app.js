(async () => {
  const summary = document.getElementById("summary");
  const timeline = document.getElementById("timeline");
  const stamp = document.getElementById("timestamp");
  try {
    const response = await fetch("../data/reservoirs.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Snapshot unavailable");
    const data = await response.json();
    const stations = (data.reservoirs || []).filter(r => r.status === "ok" && Number.isFinite(r.storage_af));
    if (!stations.length) throw new Error("No valid stations");
    summary.replaceChildren();
    for (const station of stations) {
      const line = document.createElement("div");
      line.className = "row";
      const label = document.createElement("span");
      label.textContent = station.name + " · " + Math.round(station.storage_af).toLocaleString() + " acre-ft";
      const trend = document.createElement("span");
      trend.className = "meta";
      trend.textContent = station.change_7d_af == null ? "7-day change unavailable" :
        (station.change_7d_af > 0 ? "+" : "") + Math.round(station.change_7d_af).toLocaleString() + " acre-ft / 7 days";
      line.append(label, trend);
      summary.append(line);
    }
    const time = new Date(data.generated_at);
    stamp.textContent = "Snapshot generated " + (Number.isNaN(time.getTime()) ? data.generated_at : time.toLocaleString()) + " · CDEC daily storage, not designated flood-control space.";
    timeline.replaceChildren();
    const withHistory = stations.filter(r => Array.isArray(r.history) && r.history.length > 1);
    if (!withHistory.length) {
      timeline.style.display = "block";
      timeline.textContent = "Daily history is not yet included in the published snapshot. The verified 7-day changes above are available.";
      return;
    }
    timeline.style.display = "block";
    for (const station of withHistory) {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = station.name;
      heading.style.fontSize = "1.1rem";
      section.append(heading);
      const observations = station.history.slice(-7);
      const min = Math.min(...observations.map(o => o.storage_af));
      const max = Math.max(...observations.map(o => o.storage_af));
      const chart = document.createElement("div");
      chart.style.cssText = "display:flex;align-items:end;gap:8px;height:130px;margin:12px 0 25px";
      for (const observation of observations) {
        const bar = document.createElement("div");
        bar.style.cssText = "flex:1;min-width:0;text-align:center";
        const visual = document.createElement("div");
        visual.style.cssText = "background:#167454;border-radius:3px 3px 0 0;margin:auto;width:100%;";
        visual.style.height = (20 + 80 * (max === min ? 0.5 : (observation.storage_af - min) / (max - min))) + "px";
        visual.title = observation.observed_at + ": " + Math.round(observation.storage_af).toLocaleString() + " acre-ft";
        const label = document.createElement("small");
        label.style.cssText = "display:block;font-size:10px;overflow:hidden";
        label.textContent = observation.observed_at.slice(4,8);
        bar.append(visual,label);
        chart.append(bar);
      }
      section.append(chart);
      timeline.append(section);
    }
    const explanation = document.createElement("p");
    explanation.className = "meta";
    explanation.textContent = "Bar heights show relative variation within each reservoir over its last seven recorded observations; they do not compare absolute capacity across reservoirs.";
    timeline.append(explanation);
  } catch (error) {
    summary.textContent = "Current observations unavailable. Consult California Water Watch.";
    timeline.style.display = "block";
    timeline.textContent = "Daily history unavailable.";
    stamp.textContent = "Data snapshot unavailable.";
  }
})();

(async () => {
  const target = document.getElementById("forecast-periods");
  const source = document.getElementById("forecast-source");
  if (!target) return;
  try {
    const response = await fetch("../data/forecast.json", {cache:"no-store"});
    if (!response.ok) throw new Error("Forecast snapshot unavailable");
    const forecast = await response.json();
    const periods = (forecast.periods || []).slice(0,14);
    if (!periods.length) throw new Error("No forecast periods");
    target.replaceChildren();
    for (const period of periods) {
      const row = document.createElement("div");
      row.className = "row";
      const label = document.createElement("span");
      label.textContent = (period.name || "Period") + " · " + (period.short_forecast || "No summary");
      const detail = document.createElement("span");
      detail.className = "meta";
      const probability = period.precipitation_probability_pct;
      detail.textContent = (probability == null ? "Precipitation probability unavailable" : probability + "% chance of precipitation") +
        (period.temperature_f == null ? "" : " · " + period.temperature_f + "°F");
      row.append(label,detail);
      target.append(row);
    }
    source.textContent = "NWS forecast for " + forecast.location + " · Updated " +
      (forecast.updated_at ? new Date(forecast.updated_at).toLocaleString() : "time unavailable") +
      ". These are point forecasts, not statewide precipitation totals or flood probabilities. Days 8–14 outlook not yet connected.";
  } catch {
    target.textContent = "Forecast snapshot not yet published. See the NWS forecast center below.";
    source.textContent = "Forecast data unavailable; do not infer safe conditions. Use official NWS alerts.";
  }
})();