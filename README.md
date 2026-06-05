# livingmetacolchicine — MetaFlow Living Evidence Platform

A single-file, offline browser tool for a living random-effects meta-analysis of
colchicine in cardiovascular disease. It pools per-trial log odds ratios with the
DerSimonian-Laird random-effects model, applies a Hartung-Knapp-Sidik-Jonkman
small-sample correction, reports a t-based prediction interval and Egger's test,
and renders trend, forest (standard + cumulative), funnel, leave-one-out influence,
and Baujat views. Seed data are the major colchicine CVD trials (COLCOT, LoDoCo2,
COPS, CLEAR-SYNERGY); studies can be added manually or pulled from ClinicalTrials.gov
when online (with an embedded mirror fallback).

## Offline

All assets are vendored locally — the app runs with no network access:

- `plotly.min.js` (Plotly 2.27.0) — charts
- `tailwind.js` (Tailwind Play CDN build) — styling
- `jstat.min.js` (jStat 1.9.6) — Student-t CDF for Egger's test
- engine.js — pure statistics core
- Google Fonts and Font Awesome links removed (icons degrade gracefully)

There are zero `http(s)://` resource references in `index.html`. The
ClinicalTrials.gov fetch URLs remain as runtime strings (built by concatenation,
not as literal `https://`), and the fetch is best-effort with an embedded-mirror
fallback, so the tool is fully usable offline.

## Layout

- `index.html` — the application (UI, Plotly rendering, CT.gov fetch, state)
- `engine.js` — pure statistical functions: `Stats.analyze(trials)` and
  `Stats.getTCrit(df)`. CommonJS export for Node testing.
- `tests.js` — pure Node tests with independently hand-derived expected values
- `jstat.min.js`, `plotly.min.js`, `tailwind.js` — vendored dependencies

## Tests

```
node tests.js
```

37 checks: a fully hand-worked 2-study pooling example, a heterogeneous
3-study case (tau^2 = 0.24, I^2 = 96), `getTCrit` boundaries, and edge cases
(k = 1 passthrough, two identical studies giving tau^2 = 0 / I^2 = 0, empty and
all-invalid input returning `null`). Every expected value is derived by hand in
the test comments, not by running the engine.

## Method notes

- Pooling is on the log scale; estimates are back-transformed only for display.
- DL tau^2 = max(0, (Q - (k-1)) / C), C = sum(W) - sum(W^2)/sum(W).
- I^2 = max(0, (Q - (k-1)) / Q).
- HKSJ standard error = DL SE x max(1, q), with the t_{k-1} critical value
  for confidence intervals (the floor and the t critical value are both present).
- Prediction interval uses t_{k-2} (df floored at 1) and the DL SE.

## Fixes applied during revival (2026-06-05)

- Vendored Plotly, Tailwind, and jStat locally; removed the Google Fonts and
  Font Awesome external links — the app is now fully offline.
- Extracted the pure statistics core into `engine.js` (loaded before the inline
  script) and deleted the inline duplicate; added a CommonJS export for testing.
- Added `tests.js` (Node) with hand-derived expected values.
- Renamed `livingmetacolchine.html` to `index.html` for GitHub Pages.

No statistical-methodology bugs were found; the DL / HKSJ-floor / t-critical-value
logic was already correct and was kept faithful (verified against hand calculations
in `tests.js`).
