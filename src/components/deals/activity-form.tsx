"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createActivityAction, type ActivityState } from "@/server/activities";

const initialState: ActivityState = {};

const TYPE_OPTIONS = [
  { value: "NOTE", label: "Nota" },
  { value: "CALL", label: "Ligação" },
  { value: "EMAIL", label: "E-mail" },
  { value: "MEETING", label: "Reunião" },
  { value: "TASK", label: "Tarefa" },
];

export function ActivityForm({ dealId }: { dealId: string }) {
  const action = createActivityAction.bind(null, dealId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-md border p-4">
      <div className="grid grid-cols-2 gap-3">
        <Select name="type" defaultValue="NOTE">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input name="dueAt" type="date" placeholder="Prazo (opcional)" />
      </div>
      <Textarea name="body" placeholder="O que aconteceu ou o que precisa ser feito?" required />
      {state.fieldErrors?.body ? (
        <p className="text-sm text-destructive">{state.fieldErrors.body}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar atividade"}
      </Button>
    </form>
  );
}
