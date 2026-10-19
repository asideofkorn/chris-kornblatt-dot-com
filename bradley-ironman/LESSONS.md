# Lessons learned: race-day tracker, IRONMAN California, Oct 18 2026

A running log of what went wrong, what it cost, the root cause, and the rule it taught. Times are Pacific.
Written during and after the race so the post-mortem isn't reconstructed from memory.

## Incidents

### 1. Fast swim pulled the whole forecast forward (9:00–9:22 am)
- **Symptom:** after a 56:41 swim (19% under his 1:10 target) the finish projection jumped to ~6:21 pm.
- **Cause:** the model treated every leg's deviation from plan as "form" and carried it into later legs. The
  river current sped up the whole field; his swim was the field median.
- **Fix:** swim and transition splits no longer set form for later legs. (Later extended: bike form no longer
  sets run form either.)
- **Rule:** a leg's deviation only means form if the field didn't deviate the same way. Compare with the field
  before carrying anything forward.

### 2. His own feed froze at bike mile 84 (1:11 pm onward)
- **Symptom:** position and estimates stopped moving; the IRONMAN app kept updating.
- **Cause:** the athlete's own split list in the timing feed stopped updating for the rest of the day. The
  per-mat lists kept updating.
- **Fix:** read his crossings from the per-mat lists too, and catch up mat by mat as soon as the page opens or
  comes back to the foreground.
- **Rule:** never depend on one view of the data when the same facts are published in two places.

### 3. Position showed him ~1 mile ahead on the run (3:21–4:53 pm)
- **Symptom:** our marker 1–2 miles ahead of the IRONMAN app; "last stretch 2:47/mi"; real crossings rejected
  as stray reads; two wrong fixes shipped before the real one.
- **Cause:** IRONMAN **renamed the run timing mats during the race** (RUN5 was mile 7.5 before the start and
  mile 6.2 after; RUN7 went from 13.8 to 8.7; RUN17–19 were new). The page, map and chart builder used a mat
  table captured before the race.
- **Fix:** load mat positions from the feed on every page open; place mats by the feed's GPS and check that
  GPS against the feed's mile (mismatch is flagged and GPS wins); chart builds use the pull's own mat list.
- **Rule:** reference data from an external system is live data. Load it at runtime, cross-check it two ways
  (here: GPS vs mile, and field-wide pace per stretch), and alert on disagreement.
- **Cost of the wrong diagnosis:** two "stray read" filters shipped (4:10 and 4:22 pm) that treated his real
  crossings as noise. A filter that rejects data should be the last hypothesis, not the first.

### 4. Test data was built with the same bug (4:36 pm)
- **Symptom:** tests passed; they even "proved" two mats read nobody.
- **Cause:** the fixture came from chart data built with the stale mat table, which collapsed RUN8–RUN12 into
  one mat.
- **Fix:** fixtures rebuilt from a pull made with the corrected builder; a test asserts every mat's GPS agrees
  with its mile.
- **Rule:** a fixture produced by the code under test inherits its bugs. Build fixtures from raw data with an
  independent path, and check them against ground truth (here: a crossing seen in person).

### 5. The live page still didn't catch up after the fix (5:08–6:30 pm)
- **Symptom:** build id confirmed new, yet "Last mat 4.1 / IRONMAN mi 86.5" stayed frozen.
- **Cause:** the mat list request had no page size, and the feed returns only the first page (no run mats).
  The test harness served the whole list in one response, so tests passed.
- **Fix:** request the full list, refuse one that doesn't reach FINISH; harness now pages like the real API
  (verified the previous build fails the tests that way).
- **Rule:** mock the API's limits, not just its shape. Pagination, page defaults and rate limits are
  behaviour; a fixture that ignores them is a fixture for a different system.

### 6. Phones kept running the old build (4:22–6:26 pm)
- **Symptom:** the "new version" banner's Refresh reloaded the same stale page; friends' pages stayed wrong
  for hours after the fix shipped.
- **Cause:** iPhone Safari served `location.reload()` from cache; the fix was invisible to anyone already
  on the page.
- **Fix:** Refresh navigates to a fresh URL; the page self-upgrades on open; build id shown in the Live
  line; `/ironman` short link always loads fresh.
- **Rule:** a client-side fix only exists once the client has it. Make the version visible, make upgrading
  automatic, and give people a link that cannot be stale.

### 7. Hourly data job silently skipped (8 am–1:30 pm)
- **Symptom:** the race timetable stayed at 11:12 am data until 1:36 pm.
- **Cause:** GitHub Actions dropped most scheduled runs on a busy Sunday.
- **Fix:** one long-running job loops hourly itself; the schedule only restarts it.
- **Rule:** cron is best-effort. Anything that must happen on time needs its own loop and a visible "as of".

## What worked
- Freezing the pre-race forecast first, so every change since is measurable.
- Recording every split and estimate (race recorder, forecast snapshots, hourly pulls), which turned each
  "why is it wrong?" into a replay that took minutes.
- Replaying the real page in a headless browser against recorded data, and checking against a crossing seen
  in person (5:15 pm at the T2 mat).
- Being a light load on the timing feed: nothing was throttled all day.

## Open items
- Prediction accuracy: ours vs IRONMAN's vs actual at every mat, after the finish.
- Hypothesis 3: own first lap on repeated roads (bike lap 2, run miles 16–25.7).
- Case study: add incidents 3, 5 and 6 to the Experiments section.
