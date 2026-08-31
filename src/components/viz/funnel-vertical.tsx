import { cn } from "@/lib/utils";
import type { FunnelColumn } from "@/components/viz/funnel-columns";

function formatDelta(value: number | null) {
  if (value === null) return "";
  return `${value < 0 ? "−" : "+"}${Math.abs(value)}%`;
}

/**
 * Funil vertical. A largura de cada faixa vem da contagem real em vez de
 * percentuais fixos, então o desenho continua honesto com qualquer número
 * de etapas — e a opacidade decrescente mantém tudo no azul da marca.
 */
export function FunnelVertical({ stages }: { stages: FunnelColumn[] }) {
  const peak = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {stages.map((stage, index) => {
        const width = Math.max((stage.count / peak) * 100, 42);
        const opacity = 1 - index * (0.5 / Math.max(stages.length - 1, 1));
        return (
          <div key={stage.label} className="contents">
            {index > 0 ? (
              <div className="flex justify-center">
                <span
                  className={cn(
                    "text-[10.5px] tabular",
                    stage.bottleneck ? "text-warning" : "text-muted-foreground"
                  )}
                >
                  {formatDelta(stage.delta)}
                  {stage.bottleneck ? " · maior queda" : ""}
                </span>
              </div>
            ) : null}
            <div
              className="mx-auto flex h-10 items-center justify-between gap-3 rounded-[5px] bg-primary px-3"
              style={{ width: `${width}%`, opacity }}
            >
              <span className="min-w-0 truncate text-[12.5px] font-medium text-primary-foreground">
                {stage.label}
              </span>
              <span className="shrink-0 text-[12.5px] font-medium text-primary-foreground tabular">
                {stage.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Divisão ganho × perdido entre os fechados. */
export function ClosedSplit({ won, lost }: { won: number; lost: number }) {
  const total = won + lost;
  if (total === 0) {
    return (
      <div className="mt-3.5 border-t pt-3 text-[11.5px] text-muted-foreground">
        Nenhum negócio fechado ainda.
      </div>
    );
  }
  const wonPct = (won / total) * 100;

  return (
    <div className="mt-3.5 border-t pt-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow">Fechados</span>
        <span className="text-[11px] text-muted-foreground tabular">{total}</span>
      </div>
      <div className="flex h-7 gap-0.5 overflow-hidden rounded-[5px]">
        {won > 0 ? (
          <div
            className="flex min-w-0 items-center justify-between gap-1.5 border-l-2 border-success bg-success-tint px-2"
            style={{ width: `${wonPct}%` }}
          >
            <span className="truncate text-[11.5px] font-medium text-success">Ganho</span>
            <span className="text-[11.5px] font-medium text-success tabular">{won}</span>
          </div>
        ) : null}
        {lost > 0 ? (
          <div
            className="flex min-w-0 items-center justify-between gap-1.5 border-l-2 border-danger bg-danger-tint px-2"
            style={{ width: `${100 - wonPct}%` }}
          >
            <span className="truncate text-[11.5px] font-medium text-danger">Perdido</span>
            <span className="text-[11.5px] font-medium text-danger tabular">{lost}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
