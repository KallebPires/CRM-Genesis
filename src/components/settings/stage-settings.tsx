"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionIconButton } from "@/components/action-icon-button";
import {
  createStageAction,
  deleteStageAction,
  moveStageAction,
  type StageState,
} from "@/server/settings";

const initialState: StageState = {};

const TYPE_LABEL: Record<string, string> = { OPEN: "Aberta", WON: "Ganho", LOST: "Perdido" };

export function StageSettings({
  stages,
}: {
  stages: { id: string; name: string; type: string; order: number }[];
}) {
  const [state, formAction, pending] = useActionState(createStageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [state, pending]);

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {stages.map((stage, index) => (
          <li key={stage.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{stage.name}</span>
              <Badge variant="secondary">{TYPE_LABEL[stage.type] ?? stage.type}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <ActionIconButton
                action={moveStageAction.bind(null, stage.id, "up")}
                disabled={index === 0}
                label={`Mover ${stage.name} para cima`}
              >
                <ArrowUp className="h-4 w-4" />
              </ActionIconButton>
              <ActionIconButton
                action={moveStageAction.bind(null, stage.id, "down")}
                disabled={index === stages.length - 1}
                label={`Mover ${stage.name} para baixo`}
              >
                <ArrowDown className="h-4 w-4" />
              </ActionIconButton>
              <ActionIconButton
                action={deleteStageAction.bind(null, stage.id)}
                confirmMessage={`Excluir a etapa "${stage.name}"?`}
                className="text-muted-foreground hover:text-destructive"
                label={`Excluir ${stage.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </ActionIconButton>
            </div>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Input name="name" placeholder="Nome da nova etapa" required />
        </div>
        <Select name="type" defaultValue="OPEN">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Aberta</SelectItem>
            <SelectItem value="WON">Ganho</SelectItem>
            <SelectItem value="LOST">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          Adicionar
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
