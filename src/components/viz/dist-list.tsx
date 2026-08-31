import { cn } from "@/lib/utils";

export type DistItem = { label: string; count: number };

/**
 * Lista com a barra desenhada dentro da própria linha — mais denso que um
 * gráfico de barras separado, e a leitura continua sendo label + valor.
 * A linha de maior valor recebe destaque.
 */
export function DistList({
  items,
  tone = "accent",
  emptyMessage = "Sem dados ainda.",
}: {
  items: DistItem[];
  tone?: "accent" | "danger";
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="flex flex-1 flex-col gap-[3px]">
      {items.map((item, index) => {
        const strong = index === 0;
        return (
          <div
            key={item.label}
            className="relative flex h-7 items-center justify-between gap-3 overflow-hidden rounded-md px-2.5"
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0",
                tone === "danger" ? "bg-danger" : "bg-primary",
                strong ? "opacity-25" : "opacity-[0.12]"
              )}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
            <span
              className={cn(
                "relative min-w-0 truncate text-[12.5px]",
                strong ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "relative shrink-0 text-xs font-medium tabular",
                strong ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
