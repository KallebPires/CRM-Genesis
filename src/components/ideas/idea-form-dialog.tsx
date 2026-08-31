"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createIdeaAction, updateIdeaAction, type IdeaState } from "@/server/ideas";
import {
  SERVICE_TYPE_LABELS,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_ORDER,
  EFFORT_LABELS,
} from "@/lib/format";

const initialState: IdeaState = {};

export type IdeaFormValues = {
  id: string;
  title: string;
  description: string | null;
  referenceName: string | null;
  referenceUrl: string | null;
  category: string;
  status: string;
  potential: number;
  effort: string;
  targetAudience: string | null;
  notes: string | null;
};

export function IdeaFormDialog({
  idea,
  trigger,
}: {
  idea?: IdeaFormValues;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const action = idea ? updateIdeaAction.bind(null, idea.id) : createIdeaAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const hasErrors =
    Boolean(state.error) ||
    Boolean(state.fieldErrors && Object.keys(state.fieldErrors).length > 0);
  const { notifySubmitted } = useCloseOnSuccess(pending, hasErrors, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova ideia
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{idea ? "Editar ideia" : "Nova ideia"}</DialogTitle>
        </DialogHeader>
        <form
          action={formAction}
          onSubmit={notifySubmitted}
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Nome da ideia</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex.: Plataforma de agendamento para clínicas"
              defaultValue={idea?.title}
              required
            />
            {state.fieldErrors?.title ? (
              <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">O que é</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Que problema resolve e como funcionaria"
              defaultValue={idea?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceName">Referência lá fora</Label>
              <Input
                id="referenceName"
                name="referenceName"
                placeholder="Ex.: Calendly"
                defaultValue={idea?.referenceName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceUrl">Site da referência</Label>
              <Input
                id="referenceUrl"
                name="referenceUrl"
                placeholder="https://..."
                defaultValue={idea?.referenceUrl ?? ""}
              />
              {state.fieldErrors?.referenceUrl ? (
                <p className="text-sm text-destructive">{state.fieldErrors.referenceUrl}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Tipo</Label>
              <Select name="category" defaultValue={idea?.category ?? "SAAS"}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estágio</Label>
              <Select name="status" defaultValue={idea?.status ?? "BACKLOG"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_STATUS_ORDER.map((value) => (
                    <SelectItem key={value} value={value}>
                      {IDEA_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="potential">Potencial (1 a 5)</Label>
              <Select name="potential" defaultValue={String(idea?.potential ?? 3)}>
                <SelectTrigger id="potential" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effort">Esforço</Label>
              <Select name="effort" defaultValue={idea?.effort ?? "MEDIUM"}>
                <SelectTrigger id="effort" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EFFORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Para quem</Label>
            <Input
              id="targetAudience"
              name="targetAudience"
              placeholder="Ex.: clínicas pequenas, PMEs de logística"
              defaultValue={idea?.targetAudience ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Concorrentes no Brasil, riscos, o que investigar"
              defaultValue={idea?.notes ?? ""}
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
