import { useMutation, useQuery } from "@tanstack/react-query";

export type StoreSettings = {
  language: string;
  currency: string;
  approvalLimit: string;
  notifications: Record<string, boolean>;
  discountRules: Array<{ name: string; target: string; value: string }>;
  reviewRules: Array<{ channel: string; state: string; score: string }>;
};

export const settingsQueryKey = ["store-settings"] as const;

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const response = await fetch("/api/settings", {
    headers: {
      accept: "application/json",
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to load settings");
  }

  return payload;
}

export async function saveStoreSettings(
  settings: StoreSettings,
): Promise<{ settings: StoreSettings; message: string }> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(settings),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to save settings");
  }

  return payload;
}

export function useStoreSettingsQuery() {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchStoreSettings,
  });
}

export function useSaveStoreSettingsMutation() {
  return useMutation({
    mutationFn: saveStoreSettings,
  });
}
