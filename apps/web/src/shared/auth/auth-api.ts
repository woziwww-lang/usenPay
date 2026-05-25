import { useMutation } from "@tanstack/react-query";
import { type ManagerSession, useAuthStore } from "./auth-store";

export async function loginManager(managerId: string): Promise<ManagerSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ managerId }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Login failed");
  }

  return payload;
}

export function useLoginManagerMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: loginManager,
    onSuccess: setSession,
  });
}
