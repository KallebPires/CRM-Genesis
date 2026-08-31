import { cn } from "@/lib/utils";

export type FunnelColumn = {
  label: string;
  count: number;
  /** Variação percentual contra a etapa anterior; null na primeira. */
  delta: number | null;
  /** Altura relativa da barra, 0–100. */
  height: number;
  /** Marca a maior queda do funil. */
  bottleneck?: boolean;
  tone?: "open" | "won" | "lost";
};

function formatDelta(value: number | null) {
  if (value === null) return "100%";
  return `${value < 0 ? "−" : "+"}${Math.abs(value)}%`;
}

function Column({ stage, numberClass }: { stage: FunnelColumn; numberClass?: string }) {
  const barTone =
    stage.tone === "won"
      ? "bg-success"
      : stage.tone === "lost"
        ? "bg-danger"
        : "bg-primary";

  return (
    <div className="flex h-full min-w-0 flex-col justify-end gap-2.5">
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-heading font-semibold leading-none tracking-tight tabular",
            stage.tone === "won" && "text-success",
            stage.tone === "lost" && "text-danger",
            numberClass ?? "text-xl"
          )}
        >
          {stage.count}
        </span>
        <span
          className={cn(
            "text-[11px] tabular",
            stage.bottleneck ? "text-warning" : "text-muted-foreground"
          )}
        >
          {formatDelta(stage.delta)}
        </span>
      </div>
      <div
        className={cn(
          "rounded-t-[5px] opacity-90",
          barTone,
          stage.bottleneck && "shadow-[inset_0_2px_0_var(--color-warning)]"
        )}
        style={{ height: `${Math.max(stage.height, 2)}%` }}
      />
      <span className="truncate text-[11.5px] text-muted-foreground">{stage.label}</span>
    </div>
  );
}

/** Funil em colunas. `closed` acrescenta Ganho/Perdido depois de um divisor. */
export function FunnelColumns({
  stages,
  closed,
  numberClass,
}: {
  stages: FunnelColumn[];
  closed?: FunnelColumn[];
  numberClass?: string;
}) {
  const template = closed
    ? `repeat(${stages.length}, 1fr) 20px repeat(${closed.length}, .72fr)`
    : `repeat(${stages.length}, 1fr)`;

  return (
    <div
      className="grid min-h-0 flex-1 items-end gap-2.5"
      style={{ gridTemplateColumns: template }}
    >
      {stages.map((stage) => (
        <Column key={stage.label} stage={stage} numberClass={numberClass} />
      ))}

      {closed ? (
        <>
          <div className="flex h-full items-center justify-center">
            <div className="h-[82%] w-px bg-border" />
          </div>
          {closed.map((stage) => (
            <Column key={stage.label} stage={stage} numberClass={numberClass} />
          ))}
        </>
      ) : null}
    </div>
  );
}
