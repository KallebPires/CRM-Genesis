import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function StaleDealsList({
  deals,
}: {
  deals: { id: string; title: string; daysSinceContact: number }[];
}) {
  if (deals.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum negócio parado. Bom trabalho!</p>;
  }

  return (
    <ul className="space-y-2">
      {deals.map((deal) => (
        <li key={deal.id}>
          <Link
            href={`/deals/${deal.id}`}
            className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              {deal.title}
            </span>
            <span className="text-muted-foreground">{deal.daysSinceContact} dias sem contato</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
