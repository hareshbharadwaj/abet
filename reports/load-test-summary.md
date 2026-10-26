## ✅ Load Test — 303/303 cases passed (100.0%)

- **Ref:** `arena/b28508eb-abet` · **Commit:** `0cee3c6`
- **Target:** http://127.0.0.1:4173
- **Scenario phase:** 22.7s · concurrency 10
- **Load phase:** 2520 requests in 20.28s · 124.27 req/s · p95 703.1ms · 0% errors

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
| Throughput (req/s) | 124.27 | ≥ 5 | ✅ PASS |
| p95 latency (ms) | 703.1 | ≤ 3000 | ✅ PASS |
| Error rate (%) | 0 | ≤ 1 | ✅ PASS |

### Report

- `reports/Load_Test_Analysis_Report.xlsx` — Executive Summary, Load Test Results, Performance Standards, Load Phase Metrics, Environment
- `reports/load-test-results.csv` — flat results
