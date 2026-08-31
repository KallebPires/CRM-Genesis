"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateBlockAction, updateBlockAction } from "@/server/proposals";

export type BlockValues = {
  id: string;
  label: string;
  content: string | null;
  state: string;
};

export function DocBlock({ block, index }: { block: BlockValues; index: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content ?? "");
  const [pending, startTransition] = useTransition();

  const generating = block.state === "GENERATING" || pending;

  function generate() {
    startTransition(async () => {
      const result = await generateBlockAction(block.id);
      if (result.error) toast.error(result.error);
    });
  }

  function save() {
    startTransition(async () => {
      const result = await updateBlockAction(block.id, draft);
      if (result.error) toast.error(result.error);
      else setEditing(false);
    });
  }

  return (
    <section id={`bloco-${block.id}`} className="scroll-mt-6 border-b pb-6 last:border-b-0">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight">
          <span className="text-[11px] text-muted-foreground tabular">
            {String(index + 1).padStart(2, "0")}
          </span>
          {block.label}
        </h2>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3.5 w-3.5" /> Cancelar
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                <Check className="mr-1 h-3.5 w-3.5" /> Salvar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(block.content ?? "");
                  setEditing(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
              </Button>
              <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
                <Sparkles className={cn("mr-1 h-3.5 w-3.5", generating && "animate-pulse")} />
                {generating ? "Gerando..." : block.content ? "Regerar" : "Gerar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="text-sm"
        />
      ) : generating ? (
        <div className="space-y-2" aria-live="polite">
          {[100, 92, 78].map((w) => (
            <div
              key={w}
              className="h-3 animate-pulse rounded bg-muted"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : block.content ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {block.content}
        </p>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          Vazio — gere com o agente ou escreva à mão.
        </p>
      )}
    </section>
  );
}
