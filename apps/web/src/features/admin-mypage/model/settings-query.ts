import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getStoreSettings,
  saveStoreSettings as persistStoreSettings,
  type StoreSettings,
} from "@/shared/api/api-client";

export type { StoreSettings };

export const settingsQueryKey = ["store-settings"] as const;

export async function fetchStoreSettings(): Promise<StoreSettings> {
  return getStoreSettings();
}

export async function saveStoreSettings(
  settings: StoreSettings,
): Promise<{ settings: StoreSettings; message: string }> {
  return persistStoreSettings(settings);
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
