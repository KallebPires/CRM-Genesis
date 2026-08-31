"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionIconButton } from "@/components/action-icon-button";
import {
  createLossReasonAction,
  deleteLossReasonAction,
  type LossReasonState,
} from "@/server/settings";

const initialState: LossReasonState = {};

export function LossReasonSettings({
  lossReasons,
}: {
  lossReasons: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createLossReasonAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [state, pending]);

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {lossReasons.map((reason) => (
          <li key={reason.id} className="flex items-center justify-between rounded-md border p-3">
            <span>{reason.label}</span>
            <ActionIconButton
              action={deleteLossReasonAction.bind(null, reason.id)}
              confirmMessage={`Excluir o motivo "${reason.label}"?`}
              className="text-muted-foreground hover:text-destructive"
              label={`Excluir ${reason.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </ActionIconButton>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <Input name="label" placeholder="Novo motivo de perda" required className="flex-1" />
        <Button type="submit" disabled={pending}>
          Adicionar
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
