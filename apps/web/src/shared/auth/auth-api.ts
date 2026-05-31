import { useMutation } from "@tanstack/react-query";
import { requestJson } from "@/shared/api/http";
import { type ManagerSession, useAuthStore } from "./auth-store";

export async function loginManager(managerId: string): Promise<ManagerSession> {
  return requestJson<ManagerSession>("/api/auth/login", {
    method: "POST",
    body: { managerId },
  });
}

export function useLoginManagerMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginManager,
    onSuccess: setSession,
  });
}
