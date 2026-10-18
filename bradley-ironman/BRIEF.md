# Bradley Tracker: Product Brief

**Event:** 2026 IRONMAN California, Sacramento · Sun Oct 18, 2026
**Athlete:** Bradley (bib TBD)
**Owner:** Chris · **Status:** Draft v1, 2:30am race morning

---

## 1. Problem

The official IRONMAN Tracker (a white-labeled RTRT.me app by Dilltree) shows one estimated dot on a map, built from the athlete's last timing-mat split and pace. For someone watching on foot, that leaves out what matters:

- **"When will he pass *here*?"** You can't pick a spot and get an ETA. Mile markers and the elevation scrubber are the closest it gets.
- **"Do I have time to get there?"** It doesn't compare your travel time with his arrival.
- **"How sure is that?"** It shows a single dot as if it were exact, with no range. Between timing mats the error grows by minutes.
- **No input from people on the course.** A friend seeing him at mile 9 is better data than a mat 6 miles back, but there's no way to enter it.
- **Bike and run loops are confusing.** Each loop passes many spots twice, and the app doesn't tell you which pass is next.

## 2. Users

| User | Situation | Main need |
|---|---|---|
| **Chris (primary)** | On foot or scooter downtown, phone in hand, patchy signal, sun glare | Next place to see him, when, and whether to leave now |
| Other friends and family on course | Spread across spots | A shared sightings log and one shared prediction |
| Remote followers | At home | A link with live ETA to the finish |

## 3. Goals for today (MVP, must work by bike-to-run, ideally by T1)

1. **Pace plan with bounds.** Swim, T1, bike, T2 and run each get a *slow / expected / fast* pace, preset with defaults and replaced with Bradley's numbers.
2. **Course model.** Swim, bike (2 loops) and run (2 loops) as distance-indexed routes, so any map point maps to "mile X of leg Y". Multi-pass spots are handled.
3. **Estimated position with a range.** An "earliest to latest" segment on the course, not a dot.
4. **Spot ETAs.** Tap the map, or use my GPS, to get an arrival window (earliest / likely / latest) for **each pass** of that spot.
5. **"Can I make it?"** Compare my travel time to the spot (walk / jog / scooter pace × route distance) with his earliest ETA. Verdict: 🟢 Go (buffer) · 🟡 Tight · 🔴 Missed, wait for next pass.
6. **Split logging that updates the model.**
   - *Official split:* type the time from the IRONMAN app (swim exit, bike mats, run mats).
   - *Sighting:* one tap on "I see him now" snaps my GPS to the course and records the time.
   - Each new point recalibrates the current leg's pace and narrows the range for later legs.
7. **Mobile first.** One-thumb use, large type, readable in sunlight, works with spotty signal, state saved on the device.

### Non-goals today
Accounts, push notifications through the app stores, multi-athlete support (unless the data API works out), historical race archives.

## 4. Prediction model (v1)

- **Default paces until Bradley sends real numbers:**

  | Leg | Slow | Expected | Fast |
  |---|---|---|---|
  | Swim 2.4 mi (downstream, current-assisted) | 2:15 /100yd | 1:55 /100yd | 1:40 /100yd |
  | T1 | 12 min | 8 min | 5 min |
  | Bike 112 mi (flat Delta) | 16.0 mph | 18.0 mph | 20.0 mph |
  | T2 | 8 min | 5 min | 3 min |
  | Run 26.2 mi | 12:00 /mi | 10:30 /mi | 9:30 /mi |

- **Fade.** Run pace slows about 5–10% in the second half (afternoon heat in Sacramento). Bike loop 2 is about 3% slower than loop 1.
- **Updates.** After each observed split, the leg pace becomes a weighted mix of the observed pace and the plan, with more weight on observations as they accumulate. Past legs are locked in. Future legs shift by a small "form factor": a fast swim nudges bike and run slightly faster, but no more than ±5%.
- **Range.** Uncertainty grows with distance since the last observation and resets at each new split or sighting. The range is shown as earliest and latest clock times.
- **Start time.** Rolling swim start, roughly 6:35–7:00am. Chris enters Bradley's actual start, or it's derived from the swim split.

## 5. Screens

1. **Now** (home): a big card reading "Bradley ≈ Bike mi 38 (34–42)", next pass at my chosen spot, and a Go / Tight / Missed badge with "leave by 9:42".
2. **Map:** the course colored by leg, his range shaded, my position, saved spots and mile markers.
3. **Spots:** a saved list such as "Tower Bridge", "Capitol finish" and "Run turnaround". Each shows every pass with its ETA window and my travel time.
4. **Log:** a timeline of splits and sightings, with a one-tap "Saw him", edit and undo.
5. **Plan:** pace sliders for slow / expected / fast per leg, plus start time.

## 6. Reverse engineering the official app (feasibility)

**What we know:** The IRONMAN Tracker is reported to be a white-labeled build of **RTRT.me**, whose platform publishes per-athlete splits, current pace, estimated next point and estimated finish within seconds of a mat read. RTRT also runs a browser tracker, which very likely calls the same JSON API, probably with an app ID and token embedded in the client. *(Not verified yet.)*

**Approach with [rea](https://github.com/morluto/rea):** rea is an MCP server and CLI that can analyze websites in a Chromium browser, HAR captures and Android APKs (decompiled with JADX), and it reports network requests together with the code that issues them.
1. **Easiest:** load the RTRT/IRONMAN web tracker, capture a HAR, and have rea list the endpoints, authentication parameters and payload shapes.
2. **Fallback:** decompile the Android APK with rea's headless JADX workflow and search for the base URL, keys and routes.
3. **Check:** fetch Bradley's splits from our own code and compare them with the app.

**What it unlocks:**
- Bradley's official splits flow in automatically, with no typing.
- **The whole field:** where Bradley sits in the distribution of all athletes and his age group, rank movement per split, and a live histogram of athletes per course mile. That last one shows how crowded a spot is, which affects whether you can actually pick him out.
- **Better predictions from the field:** "athletes who swam ±3 min and biked ±10 min of Bradley today are running X". This is a much stronger model than a fade guess.

**Risks:** It may take 1–2 hours and could fail if requests are signed, behind attestation, or blocked by this sandbox's network policy. Use is limited to personal use, polling only Bradley plus a low-rate field snapshot (about every 2–5 minutes). Nothing is redistributed. The rea README limits use to authorized and lawful research, so we follow RTRT's terms.
**Recommendation:** Ship the manual-entry MVP first, because it doesn't depend on reverse engineering. Investigate the API in parallel and connect it if it works.

## 7. Features that would beat the IRONMAN app

1. **"Leave by" alarm.** Vibration or a notification when it's time to start moving to your next spot, based on your travel time and his *earliest* ETA, not the likely one.
2. **Spectator itinerary planner.** Given the bike and run loops, it finds the sequence of spots that lets you see him the most times on foot or scooter. Example: "Tower Bridge 1:10 → Capitol Mall 1:35 → Old Sac 2:20 → finish 4:05". This is the main feature.
3. **Honest ranges instead of a fake dot.** For example "Passes you between 11:02 and 11:14", with the range narrowing visibly as data comes in.
4. **Crowd-sourced sightings.** Any friend's "Saw him" tap (with an optional photo) updates the shared prediction. Spectators become the extra timing mats the course lacks.
5. **Spot-him card.** His kit colors, helmet and photo, plus how many athletes are within ±2 minutes of him (from field data), so you know how carefully to scan.
6. **Plan-vs-actual delta.** For example "+6 min ahead of goal" per leg, which is useful for shouting the right encouragement.
7. **Cutoff watch.** Early warning if his projection approaches a cutoff, such as the swim limit, the bike cutoff or midnight.
8. **Finish-line timing.** A countdown to the chute with ±, so the group is in place and filming.
9. **Remote share link.** A read-only live view for family at home.
10. **Spectator logistics layer.** Road closures, crossing points over the course, restrooms, coffee and light-rail stops, so the itinerary is something you can actually walk.

## 8. Build plan and hosting

- **Form:** a single self-contained mobile web page (HTML, JS and Leaflet maps), with no backend for the MVP.
- **Hosting options:**
  - **(a)** A private claude.ai Artifact. It's fastest, uses the Artifact location capability, and can keep a **shared sightings log** for the friend group.
  - **(b)** A `/ironman/` page on chriskornblatt.com via the existing GitHub Pages deploy. It's public, uses the browser's geolocation, and keeps state only on each device.
  - **Recommendation: (a)** for today, because shared state is what makes crowd sightings work.
- **Course geometry:** first choice is the course data the tracker loads (if the API work succeeds). Otherwise the official course maps or GPX. As a last resort, a hand-traced route through key spectator points, distance-calibrated against mile markers.
- **Order of work:**
  1. Pace model and Plan screen
  2. Course and map
  3. Spot ETAs and "Can I make it?"
  4. Log and recalibration
  5. Shared sightings
  6. API connection

## 9. Open questions for Chris and Bradley

1. Bradley's expected **swim /100yd, bike mph and run /mi**, plus his best-case and bad-day numbers, and T1/T2 estimates.
2. **Bib number** and expected swim start time (seed group in the rolling start).
3. Who else is spectating? Should they share one live log?
4. Hosting: private Artifact (shared) or a public page on chriskornblatt.com?
5. How Chris is getting around: walking, running, scooter or car?
6. A photo or description of his **kit and helmet** for the spot-him card.

---
*Course details (2 bike loops in the Delta, 2 run loops finishing at the Capitol, rolling start around 6:35–7:00) come from press coverage and the app screenshots. Confirm against the 2026 athlete guide.*
