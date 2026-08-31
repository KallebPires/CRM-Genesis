"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProposalAction, type ProposalState } from "@/server/proposals";

const initialState: ProposalState = {};

export function ProposalFormDialog({
  deals,
}: {
  deals: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProposalAction, initialState);
  const hasErrors = Boolean(state.error) || Boolean(state.fieldErrors?.title);
  const { notifySubmitted } = useCloseOnSuccess(pending, hasErrors, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Sparkles className="mr-2 h-4 w-4" /> Nova proposta
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova proposta</DialogTitle>
        </DialogHeader>
        <form action={formAction} onSubmit={notifySubmitted} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex.: Portal do aluno — EduMais"
              required
              autoFocus
            />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealId">Negócio</Label>
            <Select name="dealId">
              <SelectTrigger id="dealId" className="w-full">
                <SelectValue placeholder="Nenhum (proposta avulsa)" />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincular a um negócio dá ao agente o histórico de conversas e o valor
              negociado como contexto.
            </p>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando..." : "Criar proposta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
