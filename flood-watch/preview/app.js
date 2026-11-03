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
      const unit = document.createElement("p");
      unit.className = "meta";
      unit.textContent = "Reservoir storage (acre-feet) · daily CDEC readings";
      section.append(unit);
      const capacity = station.capacity_af || ({SHA:4552000,ORO:3424753,FOL:977000})[station.station_id];
      const chart = document.createElement("div");
      chart.style.cssText = "display:grid;grid-template-columns:76px minmax(0,1fr) 44px;gap:8px;align-items:stretch;margin:12px 0 26px";
      const axis = document.createElement("div");
      axis.style.cssText = "height:152px;display:flex;flex-direction:column;justify-content:space-between;text-align:right;font-size:11px;color:#66716b";
      const formatAxis = n => (n / 1000000).toFixed(3) + "M";
      const topTick = document.createElement("span");
      topTick.textContent = formatAxis(max);
      const bottomTick = document.createElement("span");
      bottomTick.textContent = formatAxis(min);
      axis.append(topTick,bottomTick);
      const plot = document.createElement("div");
      plot.style.cssText = "display:flex;align-items:end;gap:6px;height:152px;border-bottom:1px solid #66716b;min-width:0";
      for (const observation of observations) {
        const bar = document.createElement("div");
        bar.style.cssText = "flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:end;height:100%;position:relative";
        const visual = document.createElement("div");
        visual.style.cssText = "background:#167454;border-radius:3px 3px 0 0;width:100%;min-height:4px";
        visual.style.height = (4 + 136 * (max === min ? 0.5 : (observation.storage_af - min) / (max - min))) + "px";
        const value = Math.round(observation.storage_af).toLocaleString() + " acre-feet";
        visual.title = observation.observed_at + ": " + value;
        bar.setAttribute("aria-label", observation.observed_at + ": " + value);
        const label = document.createElement("small");
        label.style.cssText = "position:absolute;top:100%;padding-top:5px;font-size:10px;white-space:nowrap";
        label.textContent = observation.observed_at.slice(4,6) + "/" + observation.observed_at.slice(6,8);
        bar.append(visual,label);
        plot.append(bar);
      }
      const percentAxis = document.createElement("div");
      percentAxis.style.cssText = "height:152px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;font-size:11px;color:#b66c20";
      const topPercent = document.createElement("span");
      topPercent.textContent = "100%";
      const bottomPercent = document.createElement("span");
      bottomPercent.textContent = "0%";
      percentAxis.append(topPercent,bottomPercent);
      plot.style.position = "relative";
      const svgNS = "http://www.w3.org/2000/svg";
      const line = document.createElementNS(svgNS,"svg");
      line.setAttribute("viewBox","0 0 700 152");
      line.setAttribute("preserveAspectRatio","none");
      line.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none";
      const points = observations.map((o,i) => {
        const pct = Math.max(0,Math.min(100,100*o.storage_af/capacity));
        return [((i+.5)/observations.length)*700,152-pct*1.52];
      });
      const polyline = document.createElementNS(svgNS,"polyline");
      polyline.setAttribute("points",points.map(p=>p.join(",")).join(" "));
      polyline.setAttribute("fill","none");
      polyline.setAttribute("stroke","#b66c20");
      polyline.setAttribute("stroke-width","3");
      polyline.setAttribute("vector-effect","non-scaling-stroke");
      line.append(polyline);
      points.forEach(([x,y],i) => {
        const dot=document.createElementNS(svgNS,"circle");
        dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r","4");
        dot.setAttribute("fill","#b66c20");
        dot.setAttribute("vector-effect","non-scaling-stroke");
        line.append(dot);
      });
      plot.append(line);
      chart.append(axis,plot,percentAxis);
      section.append(chart);
      const range = document.createElement("p");
      range.className = "meta";
      range.style.marginTop = "24px";
      range.textContent = "Range: " + Math.round(min).toLocaleString() + "–" + Math.round(max).toLocaleString() + " acre-feet. Axis labels in millions of acre-feet (M).";
      section.append(range);
      const legend=document.createElement("p");legend.className="meta";legend.textContent="Green bars: storage (acre-feet, left axis) · Orange line: % of total capacity (right axis) · Capacity: "+Math.round(capacity).toLocaleString()+" acre-feet";section.append(legend);
      timeline.append(section);
    }
    const explanation = document.createElement("p");
    explanation.className = "meta";
    explanation.textContent = "The orange line uses the 0–100% right axis; the green bars use a zoomed storage axis. Percent full is total storage divided by published capacity, NOT flood-control capacity. The two series describe the same water volume in different units.";
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

(async () => {
  const target=document.getElementById("flow-data");
  if (!target) return;
  try {
    const response=await fetch("../data/flows.json",{cache:"no-store"});
    if (!response.ok) throw new Error("Flow snapshot not published");
    const data=await response.json();
    target.replaceChildren();
    for (const station of data.stations || []) {
      const section=document.createElement("section");
      const heading=document.createElement("h3");
      heading.style.fontSize="1.15rem";
      heading.textContent=station.name;
      section.append(heading);
      const row=document.createElement("div");
      row.className="row";
      for (const [key,label] of [["inflow_cfs","Inflow"],["outflow_cfs","Outflow"]]) {
        const field=document.createElement("div");
        field.style.flex="1";
        const metric=station[key];
        const value=metric && metric.status==="ok" && metric.latest ? Math.round(metric.latest.value_cfs).toLocaleString()+" cfs" : "Unavailable";
        const date=metric && metric.latest ? metric.latest.observed_at : "No verified observation";
        const name=document.createElement("strong");name.textContent=label;
        const reading=document.createElement("div");reading.textContent=value;
        const observed=document.createElement("small");observed.className="meta";observed.textContent="Observed: "+date;
        field.append(name,reading,observed);
        row.append(field);
      }
      section.append(row);
      target.append(section);
    }
    const footer=document.createElement("p");
    footer.className="meta";
    footer.textContent="CDEC daily flow readings. Snapshot generated "+new Date(data.generated_at).toLocaleString()+".";
    target.append(footer);
  } catch {
    target.textContent="Flow measurements not yet published. Check the USACE report or CDEC directly.";
  }
})();

(async()=>{
  const el=document.getElementById("flood-control-status");
  if(!el)return;
  try {
    const response=await fetch("../data/flood_control.json",{cache:"no-store"});
    if(!response.ok)throw Error("No verified report");
    const report=await response.json();
    el.replaceChildren();
    const date=document.createElement("span");
    date.textContent="USACE report "+report.report_date+": ";
    el.append(date);
    for(const name of ["Shasta","Oroville","Folsom Lake"]){
      const reservoir=report.reservoirs?.[name];
      const line=document.createElement("div");
      line.style.marginTop="8px";
      if(reservoir?.status==="ok"){
        const signed=reservoir.above_target_af;
        line.textContent=name+": "+Math.abs(signed).toLocaleString()+" acre-feet "+(signed>0?"above":signed<0?"below":"at")+" top-of-conservation target ("+reservoir.top_conservation_af.toLocaleString()+" acre-feet).";
      }else{
        line.textContent=name+": target comparison unavailable.";
      }
      el.append(line);
    }
    const caution=document.createElement("div");
    caution.style.marginTop="8px";
    caution.textContent="Top of conservation is an operating limit, not total reservoir capacity or a guarantee of flood safety.";
    el.append(caution);
  }catch{
    el.textContent="Official target data not yet verified. Open the USACE report for current requirements.";
  }
})();