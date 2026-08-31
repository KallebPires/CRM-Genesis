import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * `accent` paints the value in the brand blue. Reserve it for the headline
 * metric — the labels already carry the won/lost meaning, so tinting every
 * tile would spend the accent on nothing.
 */
export function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-1.5 px-5">
        <p className="eyebrow">{label}</p>
        <p
          className={cn(
            "font-heading text-[1.75rem] font-semibold leading-none tracking-tight tabular",
            accent && "text-primary"
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground tabular">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
