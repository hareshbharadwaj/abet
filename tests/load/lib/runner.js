/**
 * Load runner: executes the scenario catalogue and then a sustained load phase.
 *
 * The scenario phase is a functional pass over every load case (status code,
 * payload size, latency SLA). The sustained phase keeps N virtual users busy
 * for a fixed duration to measure throughput, p95 latency and error rate.
 */

const now = () => Number(process.hrtime.bigint()) / 1e6;

export const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
};

export const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export async function executeScenario(scenario, { timeoutMs = 15000 } = {}) {
  const started = now();
  let httpStatus = 0;
  let bytes = 0;
  let error = '';

  try {
    const response = await fetch(scenario.url, {
      method: scenario.method,
      headers: scenario.headers || {},
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    httpStatus = response.status;
    if (scenario.method !== 'HEAD') {
      const buffer = await response.arrayBuffer();
      bytes = buffer.byteLength;
    }
  } catch (fetchError) {
    error = fetchError?.message || String(fetchError);
  }

  const latencyMs = now() - started;
  const latency = Math.round(latencyMs);

  if (!error) {
    if (!scenario.expected.includes(httpStatus)) {
      error = `HTTP ${httpStatus} (expected ${scenario.expected.join('/')})`;
    } else if (bytes < scenario.minBytes) {
      error = `payload ${bytes}B is below the ${scenario.minBytes}B minimum`;
    } else if (latency > scenario.slaMs) {
      error = `latency ${latency}ms exceeded the ${scenario.slaMs}ms SLA`;
    }
  }

  return {
    id: scenario.id,
    title: scenario.title,
    category: scenario.category,
    categoryName: scenario.categoryName,
    method: scenario.method,
    path: scenario.path,
    profile: scenario.profile,
    expected: scenario.expected.join('/'),
    httpStatus,
    bytes,
    latencyMs: latency,
    slaMs: scenario.slaMs,
    status: error ? 'FAIL' : 'PASS',
    error,
  };
}

/** Runs the whole catalogue with a bounded number of requests in flight. */
export async function runScenarios(scenarios, { concurrency = 10, timeoutMs, onResult, startIndex = 0 }) {
  const results = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < scenarios.length) {
      const scenario = scenarios[cursor];
      cursor += 1;
      const result = await executeScenario(scenario, { timeoutMs });
      results.push(result);
      if (onResult) onResult(result, startIndex + (scenario.index || results.length));
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, scenarios.length)) }, () => worker())
  );

  results.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  return results;
}

/**
 * Sustained load: `users` workers request repeatedly for `durationSeconds`.
 */
export async function runLoadPhase({
  endpoints,
  users = 20,
  durationSeconds = 20,
  timeoutMs = 15000,
}) {
  const deadline = Date.now() + durationSeconds * 1000;
  const latencies = [];
  const statuses = {};
  let errors = 0;
  let requests = 0;
  let bytes = 0;
  const startedAt = Date.now();

  const worker = async (workerId) => {
    let index = workerId;
    while (Date.now() < deadline) {
      const endpoint = endpoints[index % endpoints.length];
      index += 1;

      const requestStart = now();
      try {
        const response = await fetch(endpoint.url, {
          redirect: 'manual',
          signal: AbortSignal.timeout(timeoutMs),
        });
        const body = await response.arrayBuffer();
        const latency = now() - requestStart;

        requests += 1;
        bytes += body.byteLength;
        latencies.push(latency);
        statuses[response.status] = (statuses[response.status] || 0) + 1;
        if (!response.ok) errors += 1;
      } catch {
        errors += 1;
        requests += 1;
        latencies.push(now() - requestStart);
      }
    }
  };

  await Promise.all(Array.from({ length: users }, (_, index) => worker(index)));

  const elapsedSeconds = Math.max(0.001, (Date.now() - startedAt) / 1000);
  const sorted = [...latencies].sort((a, b) => a - b);

  return {
    users,
    durationSeconds: Number(elapsedSeconds.toFixed(2)),
    requests,
    rps: Number((requests / elapsedSeconds).toFixed(2)),
    bytes,
    throughputMbps: Number(((bytes / 1024 / 1024 / elapsedSeconds) * 8).toFixed(2)),
    averageMs: Number(average(latencies).toFixed(1)),
    p50Ms: Number(percentile(latencies, 50).toFixed(1)),
    p95Ms: Number(percentile(latencies, 95).toFixed(1)),
    p99Ms: Number(percentile(latencies, 99).toFixed(1)),
    maxMs: Number((sorted[sorted.length - 1] || 0).toFixed(1)),
    errors,
    errorRate: Number(((errors / Math.max(1, requests)) * 100).toFixed(2)),
    statuses,
    buckets: buildBuckets(sorted),
  };
}

const buildBuckets = (sorted) => {
  const bounds = [50, 100, 200, 500, 1000, Infinity];
  const labels = ['< 50 ms', '50–100 ms', '100–200 ms', '200–500 ms', '500–1000 ms', '> 1000 ms'];
  let cursor = 0;
  return bounds.map((bound, index) => {
    let count = 0;
    while (cursor < sorted.length && sorted[cursor] <= bound) {
      count += 1;
      cursor += 1;
    }
    return { bucket: labels[index], requests: count };
  });
};

/** Aggregates per-endpoint metrics for the Excel workbook. */
export function aggregateByEndpoint(results) {
  const map = new Map();
  for (const result of results) {
    const key = `${result.method} ${result.path}`;
    if (!map.has(key)) {
      map.set(key, {
        endpoint: key,
        requests: 0,
        failures: 0,
        latencies: [],
        bytes: 0,
        statuses: new Set(),
      });
    }
    const entry = map.get(key);
    entry.requests += 1;
    entry.latencies.push(result.latencyMs);
    entry.bytes += result.bytes;
    entry.statuses.add(result.httpStatus);
    if (result.status === 'FAIL') entry.failures += 1;
  }

  return Array.from(map.values()).map((entry) => ({
    endpoint: entry.endpoint,
    requests: entry.requests,
    failures: entry.failures,
    averageMs: Number(average(entry.latencies).toFixed(1)),
    p95Ms: Number(percentile(entry.latencies, 95).toFixed(1)),
    maxMs: Math.max(...entry.latencies),
    avgKb: Number((entry.bytes / entry.requests / 1024).toFixed(1)),
    statuses: Array.from(entry.statuses).join(', '),
  }));
}
