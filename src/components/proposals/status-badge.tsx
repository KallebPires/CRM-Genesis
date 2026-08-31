import { cn } from "@/lib/utils";
import { PROPOSAL_STATUS_LABELS } from "@/lib/proposal-blocks";

const TONE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  GENERATING: "bg-accent text-accent-foreground",
  AWAITING: "bg-warning-tint text-warning",
  SENT: "bg-accent text-accent-foreground",
  VIEWED: "bg-secondary text-secondary-foreground",
  ACCEPTED: "bg-success-tint text-success",
  REJECTED: "bg-danger-tint text-danger",
};

export function ProposalStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11px] font-medium",
        TONE[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status === "GENERATING" ? (
        <span className="size-[5px] animate-pulse rounded-full bg-current" />
      ) : null}
      {PROPOSAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}
