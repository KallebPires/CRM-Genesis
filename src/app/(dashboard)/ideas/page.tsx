import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { IdeaFormDialog } from "@/components/ideas/idea-form-dialog";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IDEA_STATUS_LABELS, IDEA_STATUS_ORDER, ideaScore } from "@/lib/format";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { organizationId } = await requireSession();
  const { status } = await searchParams;

  const activeStatus = IDEA_STATUS_ORDER.includes(
    status as (typeof IDEA_STATUS_ORDER)[number]
  )
    ? status
    : undefined;

  const [ideas, grouped] = await Promise.all([
    db.idea.findMany({
      where: { organizationId, ...(activeStatus ? { status: activeStatus as never } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    db.idea.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: true,
    }),
  ]);

  const countFor = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count, 0);

  // Best payoff per unit of effort first; discarded ideas always sink.
  const sorted = [...ideas].sort((a, b) => {
    const discarded = Number(a.status === "DISCARDED") - Number(b.status === "DISCARDED");
    if (discarded !== 0) return discarded;
    return ideaScore(b.potential, b.effort) - ideaScore(a.potential, a.effort);
  });

  const filters = [
    { value: undefined, label: "Todas", count: total },
    ...IDEA_STATUS_ORDER.map((s) => ({
      value: s as string | undefined,
      label: IDEA_STATUS_LABELS[s],
      count: countFor(s),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideias"
        description="Softwares e ferramentas que a Genesis pensa em trazer para o Brasil"
        action={<IdeaFormDialog />}
      />

      <div className="flex flex-wrap gap-1.5">
        {filters.map((filter) => {
          const active = activeStatus === filter.value;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/ideas?status=${filter.value}` : "/ideas"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-primary bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {filter.label}
              <span className="tabular text-[0.6875rem] opacity-70">{filter.count}</span>
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Lightbulb className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {total === 0 ? "Nenhuma ideia registrada ainda" : "Nada neste estágio"}
            </p>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Registre produtos que já funcionam lá fora e ainda não têm equivalente aqui."
                : "Tente outro filtro ou registre uma nova ideia."}
            </p>
          </div>
          {total === 0 ? <IdeaFormDialog /> : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={{
                id: idea.id,
                title: idea.title,
                description: idea.description,
                referenceName: idea.referenceName,
                referenceUrl: idea.referenceUrl,
                category: idea.category,
                status: idea.status,
                potential: idea.potential,
                effort: idea.effort,
                targetAudience: idea.targetAudience,
                notes: idea.notes,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
