const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

const TOKEN_KEY = "fh.accessToken";
const REFRESH_KEY = "fh.refreshToken";
const FAMILY_KEY = "fh.familyId";
const REMEMBER_KEY = "fh.remember";

const authSubscribers = new Set<() => void>();
function notifyAuth() {
  for (const cb of authSubscribers) cb();
}

/** Scan both stores (local wins) so refresh/profile keep working regardless of remember-me. */
function readKey(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}
function removeFromBoth(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export const auth = {
  getAccessToken: () => readKey(TOKEN_KEY),
  getRefreshToken: () => readKey(REFRESH_KEY),
  getFamilyId: () => readKey(FAMILY_KEY),
  getRememberMe: () => localStorage.getItem(REMEMBER_KEY) !== "0",

  setFamilyId: (id: string | null) => {
    removeFromBoth(FAMILY_KEY);
    if (id) {
      const store = localStorage.getItem(REMEMBER_KEY) === "0" ? sessionStorage : localStorage;
      store.setItem(FAMILY_KEY, id);
    }
    notifyAuth();
  },

  /** Persist tokens in localStorage when `remember`, otherwise in sessionStorage (tab-scoped). */
  setTokens(access: string, refresh: string, remember: boolean = true) {
    removeFromBoth(TOKEN_KEY);
    removeFromBoth(REFRESH_KEY);
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, access);
    store.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    notifyAuth();
  },

  clear() {
    removeFromBoth(TOKEN_KEY);
    removeFromBoth(REFRESH_KEY);
    removeFromBoth(FAMILY_KEY);
    // Keep REMEMBER_KEY so the user's checkbox preference survives logout.
    notifyAuth();
  },

  subscribe(cb: () => void): () => void {
    authSubscribers.add(cb);
    return () => authSubscribers.delete(cb);
  },
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {},
  retry = true,
): Promise<T> {
  const url = new URL(BASE.replace(/\/$/, "") + path, window.location.origin);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }
  const familyId = auth.getFamilyId();
  if (familyId && !url.searchParams.has("familyId") && path !== "/auth/me") {
    url.searchParams.set("familyId", familyId);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = auth.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && retry && auth.getRefreshToken()) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, options, false);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, payload.error ?? "error", payload.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = auth.getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(BASE.replace(/\/$/, "") + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    auth.setTokens(data.accessToken, data.refreshToken, auth.getRememberMe());
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | undefined>) =>
    request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, query?: Record<string, string | undefined>) =>
    request<T>(path, { method: "POST", body, query }),
  patch: <T>(path: string, body?: unknown, query?: Record<string, string | undefined>) =>
    request<T>(path, { method: "PATCH", body, query }),
  delete: <T>(path: string, query?: Record<string, string | undefined>) =>
    request<T>(path, { method: "DELETE", query }),
};
