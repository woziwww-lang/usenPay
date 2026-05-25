import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  meta: string;
};

export function KpiCard({ icon: Icon, label, value, meta }: Props) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-payblue">
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{meta}</p>
    </section>
  );
}
