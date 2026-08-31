"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
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
import { createDealAction, updateDealAction, type DealState } from "@/server/deals";

const initialState: DealState = {};

const SERVICE_TYPE_OPTIONS = [
  { value: "SITE", label: "Site" },
  { value: "SAAS", label: "SaaS" },
  { value: "ERP", label: "ERP" },
  { value: "AUTOMACAO", label: "Automação" },
  { value: "IA", label: "IA" },
  { value: "OUTRO", label: "Outro" },
];

export function DealFormDialog({
  contacts,
  companies,
  deal,
  trigger,
}: {
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  deal?: {
    id: string;
    title: string;
    contactId: string | null;
    companyId: string | null;
    value: number;
    serviceType: string;
    expectedCloseDate: string | null;
  };
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = deal ? updateDealAction.bind(null, deal.id) : createDealAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const isEditing = Boolean(deal);
  const hasErrors = Boolean(state.error) || Boolean(state.fieldErrors && Object.keys(state.fieldErrors).length > 0);

  const { notifySubmitted } = useCloseOnSuccess(pending, hasErrors, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo negócio
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar negócio" : "Novo negócio"}</DialogTitle>
        </DialogHeader>
        <form
          action={formAction}
          onSubmit={notifySubmitted}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={deal?.title} required />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min={0}
                step="0.01"
                defaultValue={deal?.value ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de serviço</Label>
              <Select name="serviceType" defaultValue={deal?.serviceType ?? "OUTRO"}>
                <SelectTrigger id="serviceType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactId">Contato</Label>
              <Select name="contactId" defaultValue={deal?.contactId ?? undefined}>
                <SelectTrigger id="contactId" className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Empresa</Label>
              <Select name="companyId" defaultValue={deal?.companyId ?? undefined}>
                <SelectTrigger id="companyId" className="w-full">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Previsão de fechamento</Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              defaultValue={deal?.expectedCloseDate ?? ""}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
