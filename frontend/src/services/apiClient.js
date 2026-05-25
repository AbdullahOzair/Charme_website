// frontend/src/services/apiClient.js
/**
 * Enhanced API client with:
 *   • Request deduplication  — parallel calls to the same URL share one in-flight request
 *   • Response cache         — successful GET responses cached for 5 minutes
 *   • 401 / JWT refresh      — transparently refreshes the access token and retries
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Shared state (module-level singletons) ────────────────────────────────────

/** GET requests currently in flight, keyed by full URL. Values are Promises. */
const inFlight = new Map();

/** Cached successful GET responses: url → { data, cachedAt } */
const responseCache = new Map();

// ── Axios instance ────────────────────────────────────────────────────────────

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
  withCredentials: true,
});

// Attach bearer token to every request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

// Handle 401 → refresh → retry once
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh,
          });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return client(original);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// ── Cache helpers ─────────────────────────────────────────────────────────────

const isFresh = (entry) =>
  entry && Date.now() - entry.cachedAt < CACHE_TTL_MS;

const cacheKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(params).toString();
  return `${url}?${qs}`;
};

// ── Public interface ──────────────────────────────────────────────────────────

/**
 * Deduplicated, cached GET.
 * Identical concurrent calls share the same in-flight Promise.
 * Successful responses are cached for CACHE_TTL_MS.
 */
const cachedGet = (url, config = {}) => {
  const key = cacheKey(url, config.params);

  // Return from cache if still fresh
  const cached = responseCache.get(key);
  if (isFresh(cached)) {
    return Promise.resolve({ data: cached.data });
  }

  // Deduplicate: return the existing promise if a request for this key is in flight
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  // Start new request
  const promise = client
    .get(url, config)
    .then((res) => {
      responseCache.set(key, { data: res.data, cachedAt: Date.now() });
      inFlight.delete(key);
      return res;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
};

/** Invalidate all cached responses matching a URL prefix. */
const invalidateCache = (urlPrefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(urlPrefix)) responseCache.delete(key);
  }
};

// ── Exports ───────────────────────────────────────────────────────────────────

// Named exports for consumers that need the enhanced GET
export { cachedGet, invalidateCache };

// Default export mirrors the axios instance for POST / PATCH / DELETE usage
export default client;
