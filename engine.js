// engine.js — pure statistical core for MetaFlow (Living Evidence Platform, colchicine)
// Extracted verbatim from the inline app script during the 2026-06-05 offline revival.
// Random-effects meta-analysis on the log scale (DerSimonian-Laird tau^2) with a
// Hartung-Knapp-Sidik-Jonkman small-sample correction (factor floored at >= 1, t_{k-1}
// critical value), a t-based prediction interval, and Egger's regression test.
//
// Egger's test calls jStat.studentt.cdf. In the browser jStat is loaded globally before
// this file. In Node, this file picks jStat up from globalThis if present, otherwise from
// require('./jstat.min.js'). Pure functions otherwise — no DOM, no Plotly.

(function (root) {
    var jStat = (typeof root !== 'undefined' && root.jStat) ? root.jStat : null;
    if (!jStat && typeof require !== 'undefined') {
        try { jStat = require('./jstat.min.js'); } catch (e) { /* leave null; Egger guarded */ }
    }
    // jstat.min.js may export under .jStat or directly
    if (jStat && jStat.jStat) jStat = jStat.jStat;

    const Stats = {
        tCrit975: [12.71,4.30,3.18,2.78,2.57,2.45,2.36,2.31,2.26,2.23,2.20,2.18,2.16,2.14,2.13,2.12,2.11,2.10,2.09,2.09,2.08,2.07,2.07,2.06,2.06,2.06,2.05,2.05,2.05,2.04],
        getTCrit: (df) => { if (df < 1) return 12.71; if (df <= 30) return Stats.tCrit975[Math.round(df) - 1]; return 1.96; },

        analyze: (trials) => {
            const clean = trials.filter(t => Number.isFinite(t.log_or) && Number.isFinite(t.se) && t.se > 0);
            const k = clean.length;
            if (k === 0) return null;

            let sumW=0, sumWY=0, sumW2=0;
            clean.forEach(t => { const w = 1/(t.se*t.se); sumW+=w; sumWY+=w*t.log_or; sumW2+=w*w; });
            const thetaFE = sumWY/sumW;
            let Q=0; clean.forEach(t => { Q += (1/(t.se*t.se)) * Math.pow(t.log_or-thetaFE, 2); });

            const C = sumW - (sumW2/sumW);
            const tau2 = (C>0 && Q>(k-1)) ? Math.max(0, (Q-(k-1))/C) : 0;
            let sumWstar=0, sumWstarY=0;
            clean.forEach(t => { t.w_random = 1/(t.se*t.se + tau2); sumWstar+=t.w_random; sumWstarY+=t.w_random*t.log_or; });
            const thetaRE = sumWstarY/sumWstar;
            const seDL = Math.sqrt(1/sumWstar);
            const I2 = (Q>(k-1)) ? ((Q-(k-1))/Q)*100 : 0;

            let hksjFactor = 1;
            if (k > 1) {
                let wResidSum = 0;
                clean.forEach(t => { wResidSum += t.w_random * Math.pow(t.log_or - thetaRE, 2); });
                hksjFactor = Math.sqrt(wResidSum / (k-1));
                if(isNaN(hksjFactor)) hksjFactor = 1;
            }
            const seHKSJ = seDL * Math.max(1, hksjFactor);

            const dfCI = k>1 ? k-1 : 1;
            const tCI = Stats.getTCrit(dfCI);
            const dfPI = Math.max(1, k-2);
            const tPI = Stats.getTCrit(dfPI);
            const piWidth = tPI * Math.sqrt(tau2 + seDL*seDL);

            // Corrected Egger's Test
            let eggerP = 1.0;
            if (k >= 3) {
                let sx=0, sy=0, sxx=0, sxy=0;
                clean.forEach(t => {
                    const x = 1/t.se; const y = t.log_or/t.se;
                    sx+=x; sy+=y; sxx+=x*x; sxy+=x*y;
                });

                const denom = k*sxx - sx*sx;
                const slope = (k*sxy - sx*sy)/denom;
                const intercept = (sy*sxx - sx*sxy)/denom;

                let sse = 0;
                clean.forEach(t => {
                    const yHat = intercept + slope * (1/t.se);
                    sse += Math.pow((t.log_or/t.se) - yHat, 2);
                });
                const mse = sse / (k - 2);

                const tStat = intercept / Math.sqrt(mse * sxx / denom); // Fixed SE calculation
                if (jStat && jStat.studentt) {
                    eggerP = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), k-2));
                }
            }

            return { thetaRE, seRE: seHKSJ, tau2, I2, piWidth, ciWidth: tCI*seHKSJ, eggerP, Q, k };
        }
    };

    root.Stats = Stats;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Stats, getTCrit: Stats.getTCrit, analyze: Stats.analyze };
    }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
