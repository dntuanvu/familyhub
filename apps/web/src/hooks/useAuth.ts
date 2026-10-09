import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, auth } from "../lib/api";
import type { Me } from "../lib/types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/auth/me"),
    enabled: !!auth.getAccessToken(),
    staleTime: 60_000,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    const refresh = auth.getRefreshToken();
    try {
      if (refresh) await api.post("/auth/logout", { refreshToken: refresh });
    } catch {
      // ignore
    }
    auth.clear();
    qc.clear();
    window.location.href = "/login";
  };
}
