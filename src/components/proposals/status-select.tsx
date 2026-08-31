"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setProposalStatusAction } from "@/server/proposals";
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_ORDER } from "@/lib/proposal-blocks";

export function StatusSelect({
  proposalId,
  status,
}: {
  proposalId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(next) => {
        if (!next || next === status) return;
        startTransition(async () => {
          const result = await setProposalStatusAction(proposalId, next);
          if (result.error) toast.error(result.error);
        });
      }}
    >
      <SelectTrigger className="w-56" disabled={pending} aria-label="Status da proposta">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROPOSAL_STATUS_ORDER.map((value) => (
          <SelectItem key={value} value={value}>
            {PROPOSAL_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
