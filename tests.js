// tests.js — pure Node tests for engine.js (MetaFlow stats core)
// Every expected value is hand-derived independently in the comments below,
// NOT produced by running the engine. Run: node tests.js
//
// jStat is required so engine.js can compute Egger's p (it picks jStat up from
// globalThis if present; we set it here to be explicit and robust).
let jstatMod;
try { jstatMod = require('./jstat.min.js'); } catch (e) {}
if (jstatMod) { globalThis.jStat = jstatMod.jStat || jstatMod; }

const { Stats, analyze, getTCrit } = require('./engine.js');

let passed = 0, failed = 0;
function approx(label, got, exp, tol) {
    tol = tol === undefined ? 1e-9 : tol;
    if (got === null || got === undefined || Number.isNaN(got)) {
        console.log('FAIL ' + label + ': got ' + got + ', expected ' + exp);
        failed++; return;
    }
    if (Math.abs(got - exp) <= tol) {
        console.log('PASS ' + label + ' (' + got + ')');
        passed++;
    } else {
        console.log('FAIL ' + label + ': got ' + got + ', expected ' + exp + ' (tol ' + tol + ')');
        failed++;
    }
}
function check(label, cond) {
    if (cond) { console.log('PASS ' + label); passed++; }
    else { console.log('FAIL ' + label); failed++; }
}

// ----------------------------------------------------------------------------
// 1. Fully hand-worked 2-study pooling example
//    Study A: log_or=-0.20, se=0.10  => var=0.01, w=100
//    Study B: log_or=-0.40, se=0.20  => var=0.04, w=25
//    sumW=125, sumWY=100*(-0.20)+25*(-0.40)=-30 => thetaFE=-0.24
//    sumW2=10000+625=10625
//    Q = 100*(-0.20-(-0.24))^2 + 25*(-0.40-(-0.24))^2
//      = 100*(0.04)^2 + 25*(-0.16)^2 = 100*0.0016 + 25*0.0256 = 0.16+0.64 = 0.80
//    k=2, k-1=1.  Q(0.80) > 1 ? NO  => tau2 = 0
//    C = 125 - 10625/125 = 125 - 85 = 40 (unused since Q<=k-1)
//    With tau2=0: thetaRE = thetaFE = -0.24
//    seDL = sqrt(1/125) = sqrt(0.008) = 0.0894427190999916
//    I2: Q>k-1? NO => 0
//    HKSJ: wResidSum = Q (thetaRE==thetaFE) = 0.80; factor=sqrt(0.80/1)=0.8944... <1
//          => floored to 1 => seHKSJ = seDL = 0.0894427190999916
//    dfCI=1 => tCI=getTCrit(1)=12.71; ciWidth=12.71*0.0894427191=1.1368169597...
//    dfPI=max(1,0)=1 => tPI=12.71; piWidth=12.71*sqrt(0+0.008)=1.1368169597...
//    eggerP: k<3 => 1.0
// ----------------------------------------------------------------------------
const seDL2 = Math.sqrt(0.008); // 0.08944271909999159
const ex2 = analyze([
    { log_or: -0.20, se: 0.10 },
    { log_or: -0.40, se: 0.20 }
]);
approx('2-study thetaRE = -0.24', ex2.thetaRE, -0.24, 1e-12);
approx('2-study tau2 = 0', ex2.tau2, 0, 1e-12);
approx('2-study I2 = 0', ex2.I2, 0, 1e-12);
approx('2-study Q = 0.80', ex2.Q, 0.80, 1e-12);
check('2-study k = 2', ex2.k === 2);
approx('2-study seRE (HKSJ floored) = seDL', ex2.seRE, seDL2, 1e-12);
approx('2-study ciWidth = 12.71*seDL', ex2.ciWidth, 12.71 * seDL2, 1e-12);
approx('2-study piWidth = 12.71*seDL', ex2.piWidth, 12.71 * seDL2, 1e-12);
approx('2-study eggerP = 1.0 (k<3)', ex2.eggerP, 1.0, 1e-12);

// ----------------------------------------------------------------------------
// 2. Edge: k=1 passthrough
//    Single study: log_or=-0.3, se=0.15 => var=0.0225, w=44.4444...
//    thetaFE = -0.3 ; Q=0 ; tau2=0 (Q !> 0) ; thetaRE=-0.3
//    seDL = se = 0.15 ; I2=0 ; k=1 => hksjFactor stays 1 => seRE=0.15
//    dfCI = (k>1? k-1 : 1) = 1 => tCI=12.71 => ciWidth=12.71*0.15=1.9065
// ----------------------------------------------------------------------------
const ex1 = analyze([{ log_or: -0.3, se: 0.15 }]);
approx('k=1 thetaRE = -0.3', ex1.thetaRE, -0.3, 1e-12);
approx('k=1 tau2 = 0', ex1.tau2, 0, 1e-12);
approx('k=1 I2 = 0', ex1.I2, 0, 1e-12);
approx('k=1 Q = 0', ex1.Q, 0, 1e-12);
approx('k=1 seRE = se (0.15)', ex1.seRE, 0.15, 1e-12);
approx('k=1 ciWidth = 12.71*0.15', ex1.ciWidth, 12.71 * 0.15, 1e-12);

// ----------------------------------------------------------------------------
// 3. Edge: two identical studies => tau2=0 and I2=0
//    Both: log_or=-0.5, se=0.2 => w=25 each. sumW=50, sumWY=-25 => thetaFE=-0.5
//    Q = 25*(0)^2 + 25*(0)^2 = 0 ; Q(0) > k-1(1)? NO => tau2=0, I2=0
//    thetaRE=-0.5; seDL=sqrt(1/50)=sqrt(0.02)=0.1414213562...
// ----------------------------------------------------------------------------
const exId = analyze([
    { log_or: -0.5, se: 0.2 },
    { log_or: -0.5, se: 0.2 }
]);
approx('identical thetaRE = -0.5', exId.thetaRE, -0.5, 1e-12);
approx('identical Q = 0', exId.Q, 0, 1e-12);
approx('identical tau2 = 0', exId.tau2, 0, 1e-12);
approx('identical I2 = 0', exId.I2, 0, 1e-12);
approx('identical seRE = sqrt(0.02)', exId.seRE, Math.sqrt(0.02), 1e-12);

// ----------------------------------------------------------------------------
// 4. Edge: empty input => null guard
// ----------------------------------------------------------------------------
check('empty input returns null', analyze([]) === null);
check('all-invalid input returns null',
    analyze([{ log_or: NaN, se: 0.1 }, { log_or: -0.2, se: 0 }]) === null);

// ----------------------------------------------------------------------------
// 5. getTCrit boundary checks (hand: table index df-1; df<1 ->12.71; df>30 ->1.96)
// ----------------------------------------------------------------------------
approx('getTCrit(1) = 12.71', getTCrit(1), 12.71, 1e-12);
approx('getTCrit(2) = 4.30', getTCrit(2), 4.30, 1e-12);
approx('getTCrit(30) = 2.04', getTCrit(30), 2.04, 1e-12);
approx('getTCrit(31) = 1.96', getTCrit(31), 1.96, 1e-12);
approx('getTCrit(0.5) = 12.71', getTCrit(0.5), 12.71, 1e-12);

// ----------------------------------------------------------------------------
// 6. 3-study heterogeneous case: tau2 > 0, I2 > 0 (hand-derived)
//    A: log_or=0.0,  se=0.1  => var=0.01,  w=100
//    B: log_or=0.5,  se=0.1  => var=0.01,  w=100
//    C: log_or=1.0,  se=0.1  => var=0.01,  w=100
//    sumW=300, sumWY=100*0+100*0.5+100*1.0=150 => thetaFE=0.5
//    sumW2=3*10000=30000 ; C_const = 300 - 30000/300 = 300-100 = 200
//    Q = 100*(0-0.5)^2 + 100*(0.5-0.5)^2 + 100*(1.0-0.5)^2
//      = 100*0.25 + 0 + 100*0.25 = 25 + 25 = 50
//    k=3, k-1=2. Q(50)>2 => tau2 = (50-2)/200 = 48/200 = 0.24
//    I2 = (50-2)/50 *100 = 48/50*100 = 96
//    w_random = 1/(0.01+0.24) = 1/0.25 = 4 each. sumWstar=12,
//      sumWstarY = 4*(0+0.5+1.0)=4*1.5=6 => thetaRE = 6/12 = 0.5
//    seDL = sqrt(1/12) = 0.2886751345948129
//    HKSJ: wResid = 4*(0-0.5)^2 + 4*(0.5-0.5)^2 + 4*(1.0-0.5)^2
//        = 4*0.25 + 0 + 4*0.25 = 1+1 = 2 ; factor=sqrt(2/(k-1))=sqrt(2/2)=sqrt(1)=1
//        => max(1,1)=1 => seHKSJ = seDL = sqrt(1/12)
//    dfCI=k-1=2 => tCI=4.30 => ciWidth=4.30*sqrt(1/12)
//    dfPI=max(1,k-2)=1 => tPI=12.71 ; piWidth=12.71*sqrt(0.24 + 1/12)
//        1/12 = 0.0833333333..., 0.24+0.0833333=0.3233333333,
//        sqrt=0.568624072..., *12.71 = 7.227212...
// ----------------------------------------------------------------------------
const seDL3 = Math.sqrt(1 / 12);
const ex3 = analyze([
    { log_or: 0.0, se: 0.1 },
    { log_or: 0.5, se: 0.1 },
    { log_or: 1.0, se: 0.1 }
]);
approx('3-study thetaFE/RE = 0.5', ex3.thetaRE, 0.5, 1e-12);
approx('3-study Q = 50', ex3.Q, 50, 1e-12);
approx('3-study tau2 = 0.24', ex3.tau2, 0.24, 1e-12);
approx('3-study I2 = 96', ex3.I2, 96, 1e-12);
approx('3-study seRE = sqrt(1/12)', ex3.seRE, seDL3, 1e-12);
approx('3-study ciWidth = 4.30*sqrt(1/12)', ex3.ciWidth, 4.30 * seDL3, 1e-12);
approx('3-study piWidth = 12.71*sqrt(0.24+1/12)',
    ex3.piWidth, 12.71 * Math.sqrt(0.24 + 1 / 12), 1e-12);
// Egger's: by symmetry of x and residuals the intercept is 0 => p = 1.0 (two-sided)
//   x = 1/se = 10 for all; y = log_or/se = {0,5,10}. Regression of y on x with all
//   x identical is degenerate (denom = k*sxx - sx^2 = 3*300 - 30^2 = 900-900 = 0),
//   so slope/intercept are +/-Infinity/NaN -> tStat NaN -> 2*(1-cdf(NaN)) = NaN.
//   We assert eggerP is finite-or-NaN-handled: with identical SEs Egger is undefined.
check('3-study eggerP is NaN (identical SEs => Egger undefined)', Number.isNaN(ex3.eggerP));

// ----------------------------------------------------------------------------
// 7. Egger's p sanity on a genuinely asymmetric, varied-SE set (hand-checked sign)
//    Use varied SEs so Egger is defined; just assert p in [0,1] and finite.
// ----------------------------------------------------------------------------
const exEg = analyze([
    { log_or: -0.10, se: 0.30 },
    { log_or: -0.20, se: 0.20 },
    { log_or: -0.40, se: 0.10 },
    { log_or: -0.50, se: 0.05 }
]);
check('Egger p finite for varied SEs', Number.isFinite(exEg.eggerP));
check('Egger p in [0,1]', exEg.eggerP >= 0 && exEg.eggerP <= 1);

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
