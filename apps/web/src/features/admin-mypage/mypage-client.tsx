"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Bell,
  CreditCard,
  Globe2,
  KeyRound,
  Languages,
  MessageSquareText,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PermissionGate } from "@/shared/auth/permission-gate";
import { type MyPageSection, routes } from "@/shared/config/routes";
import { useToastStore } from "@/shared/model/toast-store";
import {
  type StoreSettings,
  useSaveStoreSettingsMutation,
  useStoreSettingsQuery,
} from "./model/settings-query";

const navItems: Array<{ label: string; section: MyPageSection; icon: LucideIcon }> = [
  { label: "Security", section: "security", icon: KeyRound },
  { label: "Language", section: "language", icon: Languages },
  { label: "Currency", section: "currency", icon: Globe2 },
  { label: "Discounts", section: "discounts", icon: BadgePercent },
  { label: "Reviews", section: "reviews", icon: MessageSquareText },
  { label: "Notifications", section: "notifications", icon: Bell },
  { label: "Payment rules", section: "payments", icon: CreditCard },
];

const fallbackSettings: StoreSettings = {
  language: "日本語",
  currency: "JPY - Japanese Yen",
  approvalLimit: "Discounts over 15%",
  notifications: {
    "Payment failures": true,
    "Review below 3 stars": true,
    "Cash drawer variance": true,
  },
  discountRules: [
    { name: "Lunch repeat coupon", target: "Weekday 11:00-14:00", value: "5%" },
    { name: "Student QR campaign", target: "QR payment", value: "8%" },
    { name: "Staff approval limit", target: "Manual discount", value: "15%" },
  ],
  reviewRules: [
    { channel: "Google Business", state: "Auto request after settled payment", score: "4.6" },
    { channel: "In-store survey", state: "Show QR on receipt", score: "4.3" },
    { channel: "Complaint routing", state: "Manager notification enabled", score: "SLA 15m" },
  ],
};

type Props = {
  activeSection: MyPageSection;
};

export function MyPageClient({ activeSection }: Props) {
  const settingsQuery = useStoreSettingsQuery();
  const saveSettings = useSaveStoreSettingsMutation();
  const pushToast = useToastStore((state) => state.pushToast);
  const [settings, setSettings] = useState<StoreSettings>(fallbackSettings);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  function updateNotification(key: string, checked: boolean) {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: checked,
      },
    }));
  }

  function handleSave() {
    saveSettings.mutate(settings, {
      onSuccess: (result) => {
        setSettings(result.settings);
        pushToast({
          title: result.message,
          description: `${result.settings.language} / ${result.settings.currency}`,
          tone: "success",
        });
      },
    });
  }

  return (
    <PermissionGate permission="settings:write">
      <main className="min-h-screen bg-[#f5f7fa] text-ink">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white">
                <Store size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">MyPage micro frontend</p>
                <h1 className="text-xl font-semibold text-ink">Store administration</h1>
              </div>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={routes.dashboard}
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[280px_1fr] lg:px-6">
          <aside className="rounded-lg border border-line bg-white p-3 shadow-panel">
            {navItems.map(({ icon: Icon, label, section }) => (
              <Link
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold ${
                  activeSection === section ? "bg-payblue text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
                href={routes.mypageSection(section)}
                key={section}
                onClick={() => pushToast({ title: `${label} opened`, tone: "info" })}
              >
                <Icon
                  size={17}
                  className={activeSection === section ? "text-white" : "text-slate-500"}
                  aria-hidden="true"
                />
                {label}
              </Link>
            ))}
          </aside>

          <div className="space-y-5">
            {settingsQuery.isError ? (
              <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                Failed to load settings. Existing fallback values are editable.
              </section>
            ) : null}
            {activeSection === "security" ? (
              <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-ink">Security and account</h2>
                    <p className="text-sm text-slate-600">
                      Password reset, administrator role, and approval policy.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                    <ShieldCheck size={16} aria-hidden="true" />
                    2FA ready
                  </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase text-slate-500">Current password</span>
                    <input
                      className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                      type="password"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase text-slate-500">New password</span>
                    <input
                      className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                      type="password"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase text-slate-500">Approval limit</span>
                    <select
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, approvalLimit: event.target.value }))
                      }
                      value={settings.approvalLimit}
                    >
                      <option>Discounts over 15%</option>
                      <option>Refunds over ¥5,000</option>
                      <option>All cash drawer edits</option>
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {activeSection === "language" || activeSection === "currency" ? (
              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-lg border border-line bg-white p-4 shadow-panel">
                  <h2 className="text-base font-semibold text-ink">Locale and currency</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">Language</span>
                      <select
                        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, language: event.target.value }))
                        }
                        value={settings.language}
                      >
                        <option>日本語</option>
                        <option>English</option>
                        <option>中文</option>
                        <option>한국어</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">Currency</span>
                      <select
                        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                        onChange={(event) =>
                          setSettings((current) => ({ ...current, currency: event.target.value }))
                        }
                        value={settings.currency}
                      >
                        <option>JPY - Japanese Yen</option>
                        <option>USD - US Dollar</option>
                        <option>CNY - Chinese Yuan</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-white p-4 shadow-panel">
                  <h2 className="text-base font-semibold text-ink">Notification routing</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    {Object.entries(settings.notifications).map(([item, checked]) => (
                      <label
                        className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                        key={item}
                      >
                        <span>{item}</span>
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-payblue"
                          onChange={(event) => updateNotification(item, event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === "notifications" ? (
              <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
                <h2 className="text-base font-semibold text-ink">Notification routing</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {Object.entries(settings.notifications).map(([item, checked]) => (
                    <label
                      className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                      key={item}
                    >
                      <span>{item}</span>
                      <input
                        checked={checked}
                        className="h-4 w-4 accent-payblue"
                        onChange={(event) => updateNotification(item, event.target.checked)}
                        type="checkbox"
                      />
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            {activeSection === "discounts" ? (
              <DataPanel icon={BadgePercent} rows={settings.discountRules} title="Discount management" />
            ) : null}

            {activeSection === "reviews" ? (
              <DataPanel icon={MessageSquareText} rows={settings.reviewRules} title="Review management" />
            ) : null}

            {activeSection === "payments" ? (
              <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
                <h2 className="text-base font-semibold text-ink">Payment rules</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {["Card capture: immediate", "QR timeout: 10 min", "Cash variance alert: ¥1,000"].map(
                    (rule) => (
                      <button
                        className="rounded-md border border-line px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        key={rule}
                        onClick={() =>
                          pushToast({ title: "Payment rule selected", description: rule, tone: "info" })
                        }
                        type="button"
                      >
                        {rule}
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <div className="flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-payblue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={saveSettings.isPending}
                onClick={handleSave}
                type="button"
              >
                <Save size={16} aria-hidden="true" />
                {saveSettings.isPending ? "Saving" : "Save settings"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </PermissionGate>
  );
}

type DataPanelProps = {
  icon: LucideIcon;
  title: string;
  rows: Array<Record<string, string>>;
};

function DataPanel({ icon: Icon, rows, title }: DataPanelProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-payblue" aria-hidden="true" />
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article className="rounded-md border border-line p-3" key={Object.values(row).join("-")}>
            {Object.entries(row).map(([key, value]) => (
              <div className="flex justify-between gap-4 text-sm" key={key}>
                <span className="capitalize text-slate-500">{key}</span>
                <span className="font-medium text-ink">{value}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
