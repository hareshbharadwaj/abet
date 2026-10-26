## ✅ Load Test — 300/300 scenarios passed (100.0%)

- **Ref:** `arena/b28508eb-abet` · **Commit:** `41454da`
- **Target:** http://127.0.0.1:4173
- **Scenario phase:** 22.6s · concurrency 10
- **Load phase:** 2537 requests in 20.26s · 125.25 req/s · p95 703.9ms · 0% errors

| SLO | Measured | Threshold | Result |
| --- | ---: | ---: | --- |
| Throughput (req/s) | 125.25 | ≥ 5 | ✅ PASS |
| p95 latency (ms) | 703.9 | ≤ 3000 | ✅ PASS |
| Error rate (%) | 0 | ≤ 1 | ✅ PASS |

### Report

- `reports/Load_Test_Analysis_Report.xlsx` — Summary, Scenario Results, Endpoint Metrics, Load Phase, Environment
- `reports/load-test-results.csv` — flat results
