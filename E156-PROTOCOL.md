# E156 Protocol — livingmetacolchicine

- **Project:** livingmetacolchicine (MetaFlow Living Evidence Platform)
- **Revived:** 2026-06-05
- **Type:** Offline single-file browser tool (living random-effects meta-analysis, colchicine in cardiovascular disease)
- **Dashboard:** https://mahmood726-cyber.github.io/livingmetacolchicine/

## What changed

- Vendored Plotly 2.27.0, Tailwind, and jStat 1.9.6 locally; removed Google Fonts and Font Awesome external links — zero `http(s)://` resource references remain.
- Extracted the pure DerSimonian-Laird / HKSJ statistics core into `engine.js`, deleted the inline duplicate, and added a CommonJS export.
- Added `tests.js` (37 Node checks, all hand-derived); renamed the main file to `index.html` for GitHub Pages.
- No methodology bugs found; the DL tau^2, HKSJ floor, and t-critical-value logic were already correct and kept faithful.

## Body (E156 draft — CURRENT BODY)

Does colchicine reduce major adverse cardiovascular events, and how stable is that pooled estimate as new trials accrue in a living synthesis? The seed evidence base is the major colchicine cardiovascular outcome trials — COLCOT, LoDoCo2, COPS, and CLEAR-SYNERGY — entered as per-trial log odds ratios with standard errors, extendable from ClinicalTrials.gov or by manual entry. We pool on the log scale using the DerSimonian-Laird random-effects model with a Hartung-Knapp-Sidik-Jonkman small-sample correction (variance floored at one, t with k minus one degrees of freedom). The tool reports the pooled odds ratio, tau-squared, I-squared, a t-based prediction interval, and Egger's regression test, with forest, cumulative, funnel, leave-one-out, and Baujat views. Leave-one-out influence and the cumulative forest expose whether any single trial drives the result. Heterogeneity and prediction intervals temper any single point estimate clinically. Egger's test and the embedded mirror are diagnostic, not confirmatory, of small-study effects. SUBMITTED: [ ]
