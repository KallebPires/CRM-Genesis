"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle as DialogTitleEl,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { moveDealStageAction } from "@/server/deals";
import { formatCurrency, SERVICE_TYPE_LABELS } from "@/lib/format";

export type BoardDeal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  serviceType: string;
  contactName: string | null;
  companyName: string | null;
};

export type BoardStage = {
  id: string;
  name: string;
  order: number;
  type: "OPEN" | "WON" | "LOST";
  deals: BoardDeal[];
};

export function DealsBoard({
  initialStages,
  lossReasons,
}: {
  initialStages: BoardStage[];
  lossReasons: { id: string; label: string }[];
}) {
  const [stages, setStages] = useState(initialStages);
  const [activeDeal, setActiveDeal] = useState<BoardDeal | null>(null);
  const [pendingLoss, setPendingLoss] = useState<{ dealId: string; toStageId: string } | null>(null);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function findStageOfDeal(dealId: string) {
    return stages.find((stage) => stage.deals.some((deal) => deal.id === dealId));
  }

  function applyMove(dealId: string, fromStageId: string, toStageId: string) {
    setStages((prev) => {
      const fromStage = prev.find((s) => s.id === fromStageId);
      const deal = fromStage?.deals.find((d) => d.id === dealId);
      if (!deal) return prev;
      return prev.map((stage) => {
        if (stage.id === fromStageId) {
          return { ...stage, deals: stage.deals.filter((d) => d.id !== dealId) };
        }
        if (stage.id === toStageId) {
          return { ...stage, deals: [deal, ...stage.deals] };
        }
        return stage;
      });
    });
  }

  function commitMove(dealId: string, fromStageId: string, toStageId: string, lostReasonId?: string) {
    applyMove(dealId, fromStageId, toStageId);
    startTransition(async () => {
      const result = await moveDealStageAction(dealId, toStageId, lostReasonId);
      if (result.error) {
        applyMove(dealId, toStageId, fromStageId);
        toast.error(result.error);
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const stage = findStageOfDeal(String(event.active.id));
    const deal = stage?.deals.find((d) => d.id === event.active.id) ?? null;
    setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const toStageId = String(over.id);
    const fromStage = findStageOfDeal(dealId);
    if (!fromStage || fromStage.id === toStageId) return;

    const toStage = stages.find((s) => s.id === toStageId);
    if (!toStage) return;

    if (toStage.type === "LOST") {
      setPendingLoss({ dealId, toStageId });
      setSelectedReasonId("");
      return;
    }

    commitMove(dealId, fromStage.id, toStageId);
  }

  function confirmLoss() {
    if (!pendingLoss || !selectedReasonId) return;
    const fromStage = findStageOfDeal(pendingLoss.dealId);
    if (!fromStage) return;
    commitMove(pendingLoss.dealId, fromStage.id, pendingLoss.toStageId, selectedReasonId);
    setPendingLoss(null);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages
            .sort((a, b) => a.order - b.order)
            .map((stage) => (
              <StageColumn key={stage.id} stage={stage} />
            ))}
        </div>
        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} dragging /> : null}</DragOverlay>
      </DndContext>

      <Dialog open={Boolean(pendingLoss)} onOpenChange={(open) => !open && setPendingLoss(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitleEl>Por que esse negócio foi perdido?</DialogTitleEl>
          </DialogHeader>
          <Select value={selectedReasonId} onValueChange={(value) => setSelectedReasonId(value ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um motivo" />
            </SelectTrigger>
            <SelectContent>
              {lossReasons.map((reason) => (
                <SelectItem key={reason.id} value={reason.id}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingLoss(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmLoss} disabled={!selectedReasonId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StageColumn({ stage }: { stage: BoardStage }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = stage.deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <Card
      ref={setNodeRef}
      className={`w-72 shrink-0 gap-3 py-4 transition-colors ${
        isOver ? "border-primary bg-accent/40" : ""
      }`}
    >
      <CardHeader className="px-4 pb-0">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="eyebrow">{stage.name}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground tabular">
            {stage.deals.length}
          </span>
        </CardTitle>
        <p className="font-heading text-sm font-medium tracking-tight tabular">
          {formatCurrency(total)}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-24 flex-col gap-2 px-4">
        {stage.deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}
      </CardContent>
    </Card>
  );
}

function DraggableDealCard({ deal }: { deal: BoardDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-30" : ""}>
      <DealCard deal={deal} />
    </div>
  );
}

function DealCard({ deal, dragging }: { deal: BoardDeal; dragging?: boolean }) {
  return (
    <Link href={`/deals/${deal.id}`} onClick={(e) => dragging && e.preventDefault()}>
      <div
        className={`cursor-grab space-y-1.5 rounded-lg border bg-background p-3 text-sm transition-colors hover:border-primary/40 active:cursor-grabbing ${
          dragging ? "border-primary/60 shadow-lg" : ""
        }`}
      >
        <p className="font-medium leading-snug">{deal.title}</p>
        <p className="text-xs text-muted-foreground">
          {deal.companyName ?? deal.contactName ?? "Sem contato"}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge variant="outline" className="text-[0.6875rem] font-normal">
            {SERVICE_TYPE_LABELS[deal.serviceType] ?? deal.serviceType}
          </Badge>
          <span className="font-heading text-xs font-semibold tracking-tight tabular">
            {formatCurrency(deal.value, deal.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
