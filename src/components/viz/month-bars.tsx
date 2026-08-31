import { cn } from "@/lib/utils";

export type MonthPoint = { label: string; value: number };

/** 82,9k — rótulo curto para caber sobre a barra. */
function compact(value: number) {
  if (value === 0) return "0";
  if (value < 1000) return String(Math.round(value));
  return `${(value / 1000).toFixed(1).replace(".", ",")}k`;
}

/**
 * Barras de receita por mês. A escala é opacidade do azul da marca, não hues
 * diferentes — o mês de pico fica sólido e os demais recuam.
 */
export function MonthBars({ data }: { data: MonthPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const allZero = data.every((d) => d.value === 0);

  if (allZero) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Nenhuma receita registrada no período.
      </p>
    );
  }

  return (
    <div className="flex min-h-[120px] flex-1 items-end gap-3">
      {data.map((point) => {
        const isPeak = point.value === max;
        const ratio = point.value / max;
        return (
          <div
            key={point.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span
              className={cn(
                "text-[10.5px] tabular",
                isPeak ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {compact(point.value)}
            </span>
            <div
              className="w-full rounded-t bg-primary"
              style={{
                height: `${Math.max(ratio * 92, 2)}%`,
                opacity: isPeak ? 1 : 0.3 + ratio * 0.4,
              }}
            />
            <span
              className={cn(
                "text-[11px]",
                isPeak ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
