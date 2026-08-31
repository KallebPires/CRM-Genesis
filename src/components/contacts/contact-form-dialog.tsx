"use client";

import { useActionState, useState } from "react";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Plus, Pencil } from "lucide-react";
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
import {
  createContactAction,
  updateContactAction,
  type ContactState,
} from "@/server/contacts";

const initialState: ContactState = {};

export function ContactFormDialog({
  companies,
  contact,
}: {
  companies: { id: string; name: string }[];
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    source: string | null;
    companyId: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const action = contact ? updateContactAction.bind(null, contact.id) : createContactAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const isEditing = Boolean(contact);
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
          <Plus className="mr-2 h-4 w-4" /> Novo contato
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <form
          action={formAction}
          onSubmit={notifySubmitted}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={contact?.name} required />
            {state.fieldErrors?.name ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
              {state.fieldErrors?.email ? (
                <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input id="role" name="role" defaultValue={contact?.role ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Input
                id="source"
                name="source"
                placeholder="Indicação, LinkedIn, site..."
                defaultValue={contact?.source ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyId">Empresa</Label>
            <Select name="companyId" defaultValue={contact?.companyId ?? undefined}>
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
