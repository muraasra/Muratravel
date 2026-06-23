import { useQuery } from "@tanstack/react-query";
import { apiFetch, type MeResponse } from "@/lib/api";

/** Loads the current user's profile + company context from the API. */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiFetch<MeResponse>("/api/me"),
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}
