# Race data

Raw record of Bradley's (bib 1999) official splits at IRONMAN California 2026, captured every 2 minutes from RTRT.me (the timing service behind the IRONMAN Tracker app) by the Race recorder workflow.

`data/bradley.jsonl`: one line per poll with `t` (UTC poll time), `ok`, and `list` (his splits as RTRT returned them, including `etnp`/`etfp`, the IRONMAN app's own next-mat and finish estimates at that moment).
