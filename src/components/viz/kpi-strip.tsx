import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/format";

export type KpiValues = {
  winRate: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  openValue: number;
  wonValue: number;
  avgTicket: number;
};

/**
 * Um card único dividido por bordas internas, não quatro cards soltos — a
 * primeira célula é o número herói e carrega o acento azul da marca.
 */
export function KpiStrip(props: KpiValues) {
  const { winRate, wonCount, lostCount, openCount, openValue, wonValue, avgTicket } = props;
  const closed = wonCount + lostCount;
  const pct = Math.round(winRate * 100);

  return (
    <div className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className="flex flex-col gap-2.5 bg-[linear-gradient(180deg,var(--color-accent),transparent)] px-5 pb-4 pt-4">
        <span className="eyebrow">Taxa de conversão</span>
        <div className="flex items-baseline gap-2.5">
          <span className="font-heading text-4xl font-semibold leading-none tracking-tight text-primary tabular">
            {pct}%
          </span>
          <span className="text-xs text-muted-foreground">
            {wonCount} {wonCount === 1 ? "ganho" : "ganhos"} de {closed} fechados
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-sm bg-inset">
          <div className="h-full rounded-sm bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Cell label="Negócios abertos" value={openCount} meta={formatCents(openValue)} />
      <Cell label="Ganhos" value={wonCount} meta={formatCents(wonValue)} dot="success" />
      <Cell
        label="Perdidos"
        value={lostCount}
        meta={`ticket médio ${formatCents(avgTicket)}`}
        dot="danger"
      />
    </div>
  );
}

function Cell({
  label,
  value,
  meta,
  dot,
}: {
  label: string;
  value: number;
  meta: string;
  dot?: "success" | "danger";
}) {
  return (
    <div className="flex flex-col gap-2 border-t px-5 pb-4 pt-4 sm:border-t-0 lg:border-l">
      <span className="eyebrow">{label}</span>
      <div className="flex items-center gap-2">
        {dot ? (
          <span
            className={cn(
              "size-1.5 rounded-full",
              dot === "success" ? "bg-success" : "bg-danger"
            )}
          />
        ) : null}
        <span className="font-heading text-[1.6875rem] font-semibold leading-none tracking-tight tabular">
          {value}
        </span>
      </div>
      <span className="text-xs text-muted-foreground tabular">{meta}</span>
    </div>
  );
}
