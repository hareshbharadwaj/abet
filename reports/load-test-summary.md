## ✅ Load Test — 303/303 cases passed (100.0%)

- **Ref:** `arena/b28508eb-abet` · **Commit:** `0548411`
- **Target:** http://127.0.0.1:4173
- **Scenario phase:** 22.2s · concurrency 10
- **Load phase:** 3033 requests in 20.21s · 150.04 req/s · p95 606.2ms · 0% errors

| Category | Cases | Passed | Failed | Status |
| --- | ---: | ---: | ---: | --- |
| CAT-01 Cold Page Loads (HTML Shell) | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-02 JavaScript Bundle Delivery | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-03 Stylesheet Delivery | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-04 Static Image Assets | 54 | 54 | 0 | ✅ PASS — Verified |
| CAT-05 Cached Reload Behaviour | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-06 HEAD Probe / Protocol | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-07 Error Handling (404) | 41 | 41 | 0 | ✅ PASS — Verified |
| CAT-08 Sustained Throughput | 1 | 1 | 0 | ✅ PASS — Verified |
| CAT-09 Latency SLO Compliance | 1 | 1 | 0 | ✅ PASS — Verified |
| CAT-10 Stability & Error Rate | 1 | 1 | 0 | ✅ PASS — Verified |

| SLO | Measured | Threshold | Result |
| --- | ---: | ---: | --- |
| Throughput (req/s) | 150.04 | ≥ 5 | ✅ PASS |
| p95 latency (ms) | 606.2 | ≤ 3000 | ✅ PASS |
| Error rate (%) | 0 | ≤ 1 | ✅ PASS |

### Report

- `reports/Load_Test_Analysis_Report.xlsx` — Executive Summary, Load Test Results, Performance Standards, Load Phase Metrics, Environment
- `reports/load-test-results.csv` — flat results
