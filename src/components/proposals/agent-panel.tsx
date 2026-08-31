"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendAgentMessageAction } from "@/server/proposals";
import { AGENT_ACTIONS } from "@/lib/proposal-blocks";

export type AgentMessage = { id: string; author: string; text: string };

export function AgentPanel({
  proposalId,
  thread,
  context,
}: {
  proposalId: string;
  thread: AgentMessage[];
  context: string[];
}) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const boxRef = useRef<HTMLTextAreaElement>(null);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setDraft("");
    startTransition(async () => {
      const result = await sendAgentMessageAction(proposalId, trimmed);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="flex items-center gap-2 font-heading text-[13px] font-semibold tracking-tight">
          <Sparkles className="h-4 w-4 text-primary" />
          Agente
        </span>
        {pending ? (
          <span className="text-[11px] text-muted-foreground" aria-live="polite">
            escrevendo…
          </span>
        ) : null}
      </div>

      {context.length > 0 ? (
        <div className="border-b px-4 py-3">
          <p className="eyebrow mb-1.5">Contexto</p>
          <ul className="space-y-1">
            {context.map((line) => (
              <li key={line} className="truncate text-[11.5px] text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        {thread.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">
            Peça para gerar, revisar ou ajustar qualquer parte da proposta.
          </p>
        ) : (
          thread.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[92%] rounded-lg px-3 py-2 text-[12.5px] leading-relaxed",
                message.author === "USER"
                  ? "self-end bg-accent text-accent-foreground"
                  : "self-start border bg-inset"
              )}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {AGENT_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => send(action)}
              disabled={pending}
              className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            ref={boxRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={2}
            placeholder="Peça um ajuste…"
            className="min-h-0 resize-none text-[12.5px]"
          />
          <Button
            size="icon"
            onClick={() => send(draft)}
            disabled={pending || !draft.trim()}
            aria-label="Enviar mensagem ao agente"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
