// Runtime config. In production the hosting stack overwrites this file in the
// bucket with the real API base URL. Locally, apiBase is null, so the app runs
// in client-only practice mode (scores are computed in the browser and not
// saved). See infra/lib/hosting-stack.ts.
window.EXAMFORGE_CONFIG = { apiBase: null };
