"use client";

import { useActionState, useState } from "react";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createCompanyAction,
  updateCompanyAction,
  type CompanyState,
} from "@/server/companies";

const initialState: CompanyState = {};

export function CompanyFormDialog({
  company,
}: {
  company?: { id: string; name: string; website: string | null; notes: string | null };
}) {
  const [open, setOpen] = useState(false);
  const action = company ? updateCompanyAction.bind(null, company.id) : createCompanyAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const isEditing = Boolean(company);
  const hasErrors = Boolean(state.error) || Boolean(state.fieldErrors && Object.keys(state.fieldErrors).length > 0);

  const { notifySubmitted } = useCloseOnSuccess(pending, hasErrors, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEditing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" /> Nova empresa
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar empresa" : "Nova empresa"}</DialogTitle>
        </DialogHeader>
        <form
          action={formAction}
          onSubmit={notifySubmitted}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={company?.name} required />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site</Label>
            <Input
              id="website"
              name="website"
              placeholder="https://..."
              defaultValue={company?.website ?? ""}
            />
            {state.fieldErrors?.website ? (
              <p className="text-sm text-destructive">{state.fieldErrors.website}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" defaultValue={company?.notes ?? ""} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
