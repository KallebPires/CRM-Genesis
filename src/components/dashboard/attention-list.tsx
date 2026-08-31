import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/format";

/** Acima disso o negócio deixa de ser "esfriando" e vira risco. */
export const CRITICAL_DAYS = 21;

export type AttentionDeal = {
  id: string;
  title: string;
  company: string | null;
  stage: string;
  valueCents: number;
  daysSinceContact: number;
};

export function AttentionList({ deals }: { deals: AttentionDeal[] }) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-[12.5px] text-muted-foreground">
        Nenhum negócio parado. Bom sinal.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
      {deals.map((deal) => {
        const critical = deal.daysSinceContact >= CRITICAL_DAYS;
        return (
          <Link
            key={deal.id}
            href={`/deals/${deal.id}`}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              critical
                ? "border-danger/30 bg-danger-tint hover:border-danger/50"
                : "bg-inset hover:border-primary/40"
            )}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[12.5px] font-medium">{deal.title}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {deal.company ? `${deal.company} · ` : ""}
                {deal.stage}
              </span>
            </div>
            <div className="flex flex-none flex-col items-end gap-0.5">
              <span
                className={cn(
                  "text-xs font-medium tabular",
                  critical ? "text-danger" : "text-warning"
                )}
              >
                {deal.daysSinceContact} dias
              </span>
              <span className="text-[11px] text-muted-foreground tabular">
                {formatCents(deal.valueCents)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
