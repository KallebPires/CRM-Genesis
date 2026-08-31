"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionIconButton } from "@/components/action-icon-button";
import { IdeaFormDialog, type IdeaFormValues } from "@/components/ideas/idea-form-dialog";
import { deleteIdeaAction, setIdeaStatusAction } from "@/server/ideas";
import {
  SERVICE_TYPE_LABELS,
  IDEA_STATUS_LABELS,
  IDEA_STATUS_ORDER,
  EFFORT_LABELS,
} from "@/lib/format";

export function IdeaCard({ idea }: { idea: IdeaFormValues }) {
  const [pending, startTransition] = useTransition();

  function changeStatus(status: string) {
    startTransition(async () => {
      const result = await setIdeaStatusAction(
        idea.id,
        status as (typeof IDEA_STATUS_ORDER)[number]
      );
      if (result.error) toast.error(result.error);
    });
  }

  const dimmed = idea.status === "DISCARDED";

  return (
    <Card className={dimmed ? "opacity-60" : undefined}>
      <CardContent className="space-y-3 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <h3 className="font-heading text-sm font-semibold leading-snug tracking-tight">
              {idea.title}
            </h3>
            {idea.referenceName ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                inspirado em
                {idea.referenceUrl ? (
                  <a
                    href={idea.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline"
                  >
                    {idea.referenceName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-foreground">{idea.referenceName}</span>
                )}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <IdeaFormDialog
              idea={idea}
              trigger={
                <Button variant="ghost" size="icon" aria-label={`Editar ${idea.title}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <ActionIconButton
              action={deleteIdeaAction.bind(null, idea.id)}
              confirmMessage={`Excluir a ideia "${idea.title}"?`}
              className="text-muted-foreground hover:text-destructive"
              label={`Excluir ${idea.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </ActionIconButton>
          </div>
        </div>

        {idea.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{idea.description}</p>
        ) : null}

        {idea.targetAudience ? (
          <p className="text-xs text-muted-foreground">
            <span className="eyebrow">Para</span>{" "}
            <span className="text-foreground">{idea.targetAudience}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[0.6875rem] font-normal">
            {SERVICE_TYPE_LABELS[idea.category] ?? idea.category}
          </Badge>
          <Badge variant="secondary" className="text-[0.6875rem] font-normal tabular">
            Potencial {idea.potential}/5
          </Badge>
          <Badge variant="secondary" className="text-[0.6875rem] font-normal">
            Esforço {EFFORT_LABELS[idea.effort] ?? idea.effort}
          </Badge>
        </div>

        {idea.notes ? (
          <p className="border-l-2 border-border pl-2.5 text-xs text-muted-foreground">
            {idea.notes}
          </p>
        ) : null}

        <Select value={idea.status} onValueChange={(v) => changeStatus(v ?? idea.status)}>
          <SelectTrigger size="sm" className="w-full" disabled={pending}>
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
      </CardContent>
    </Card>
  );
}
