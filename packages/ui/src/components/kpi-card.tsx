import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  meta: string;
};

export function KpiCard({ icon: Icon, label, value, meta }: Props) {
  return (
    <section className="group flex min-h-32 flex-col justify-between rounded-xl border border-line bg-white p-4 shadow-panel transition-colors duration-200 hover:border-cyan/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan/10 text-cyan transition-colors duration-200 group-hover:bg-payblue group-hover:text-white">
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-5 text-slate-600">{meta}</p>
    </section>
  );
}
