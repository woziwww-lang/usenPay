import type { VisitorPoint } from "@usen-pay/domain";

type Props = {
  points: VisitorPoint[];
};

export function VisitorChart({ points }: Props) {
  const max = Math.max(...points.map((point) => point.visitors), 1);

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Visitor flow</h2>
          <p className="text-sm text-slate-600">Seat usage and checkout wait by hour</p>
        </div>
      </div>
      <div className="mt-5 grid h-48 grid-cols-6 items-end gap-3">
        {points.map((point) => (
          <div key={point.time} className="flex h-full flex-col justify-end gap-2">
            <div className="relative flex flex-1 items-end rounded bg-slate-100">
              <div
                className="w-full rounded bg-payblue"
                style={{ height: `${Math.max(14, (point.visitors / max) * 100)}%` }}
                title={`${point.visitors} visitors`}
              />
              <span className="absolute left-1 top-1 text-xs font-semibold text-slate-700">{point.checkoutWait}m</span>
            </div>
            <span className="text-center text-xs text-slate-500">{point.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
