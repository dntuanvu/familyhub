import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:3001/api";

export const auth: { accessToken: string | null; refreshToken: string | null; familyId: string | null } = {
  accessToken: null,
  refreshToken: null,
  familyId: null,
};

export async function loadAuth() {
  auth.accessToken = await SecureStore.getItemAsync("accessToken");
  auth.refreshToken = await SecureStore.getItemAsync("refreshToken");
  auth.familyId = await SecureStore.getItemAsync("familyId");
}

export async function setTokens(access: string, refresh: string, familyId?: string) {
  auth.accessToken = access;
  auth.refreshToken = refresh;
  await SecureStore.setItemAsync("accessToken", access);
  await SecureStore.setItemAsync("refreshToken", refresh);
  if (familyId) {
    auth.familyId = familyId;
    await SecureStore.setItemAsync("familyId", familyId);
  }
}

export async function clearAuth() {
  auth.accessToken = null;
  auth.refreshToken = null;
  auth.familyId = null;
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await SecureStore.deleteItemAsync("familyId");
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {},
  retry = true,
): Promise<T> {
  const params = new URLSearchParams();
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) params.set(k, v);
    }
  }
  if (auth.familyId && !params.has("familyId") && path !== "/auth/me") {
    params.set("familyId", auth.familyId);
  }
  const qs = params.toString();
  const url = BASE.replace(/\/$/, "") + path + (qs ? `?${qs}` : "");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && retry && auth.refreshToken) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, options, false);
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new ApiError(res.status, payload.message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  if (!auth.refreshToken) return false;
  try {
    const res = await fetch(BASE.replace(/\/$/, "") + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    await setTokens(data.accessToken, data.refreshToken);
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
