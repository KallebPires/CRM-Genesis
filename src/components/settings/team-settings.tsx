"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
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
import { addMemberAction, removeMemberAction, type MemberState } from "@/server/settings";

const initialState: MemberState = {};

export function TeamSettings({
  members,
}: {
  members: { id: string; role: string; user: { name: string; email: string } }[];
}) {
  const [state, formAction, pending] = useActionState(addMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [state, pending]);

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">{member.user.name}</p>
              <p className="text-xs text-muted-foreground">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{member.role}</Badge>
              {member.role !== "OWNER" ? (
                <ActionIconButton
                  action={removeMemberAction.bind(null, member.id)}
                  confirmMessage={`Remover ${member.user.name} da equipe?`}
                  className="text-muted-foreground hover:text-destructive"
                  label={`Remover ${member.user.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </ActionIconButton>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">Adicionar membro</p>
        <div className="grid grid-cols-2 gap-2">
          <Input name="name" placeholder="Nome" required />
          <Input name="email" type="email" placeholder="E-mail" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input name="password" type="password" placeholder="Senha provisória" required minLength={8} />
          <Select name="role" defaultValue="MEMBER">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">Membro</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar"}
        </Button>
      </form>
    </div>
  );
}
