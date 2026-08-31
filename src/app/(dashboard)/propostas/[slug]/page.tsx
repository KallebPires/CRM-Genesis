import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ProposalStatusBadge } from "@/components/proposals/status-badge";
import { StatusSelect } from "@/components/proposals/status-select";
import { DocBlock } from "@/components/proposals/doc-block";
import { AgentPanel } from "@/components/proposals/agent-panel";
import { formatCents, SERVICE_TYPE_LABELS } from "@/lib/format";

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organizationId } = await requireSession();

  const proposal = await db.proposal.findFirst({
    where: { slug, organizationId },
    include: {
      blocks: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      company: { select: { name: true } },
      deal: {
        select: {
          id: true,
          title: true,
          serviceType: true,
          contact: { select: { name: true } },
          _count: { select: { activities: true } },
        },
      },
    },
  });

  if (!proposal) notFound();

  const ready = proposal.blocks.filter((b) => b.state === "READY").length;

  const context = [
    proposal.company ? `Empresa: ${proposal.company.name}` : null,
    proposal.deal ? `Negócio: ${proposal.deal.title}` : "Sem negócio vinculado",
    proposal.deal
      ? `Serviço: ${SERVICE_TYPE_LABELS[proposal.deal.serviceType] ?? proposal.deal.serviceType}`
      : null,
    proposal.deal?.contact ? `Contato: ${proposal.deal.contact.name}` : null,
    proposal.deal
      ? `${proposal.deal._count.activities} atividades no histórico`
      : null,
    `Valor: ${formatCents(proposal.valueCents, proposal.currency)}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <Link
        href="/propostas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para propostas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{proposal.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ProposalStatusBadge status={proposal.status} />
            <span className="tabular">
              {ready} de {proposal.blocks.length} blocos prontos
            </span>
            {proposal.sentAt ? (
              <span className="tabular">
                · {proposal.views} {proposal.views === 1 ? "abertura" : "aberturas"}
              </span>
            ) : null}
          </div>
        </div>
        <StatusSelect proposalId={proposal.id} status={proposal.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="py-5">
          <CardContent className="space-y-6 px-6">
            {proposal.blocks.map((block, index) => (
              <DocBlock
                key={block.id}
                index={index}
                block={{
                  id: block.id,
                  label: block.label,
                  content: block.content,
                  state: block.state,
                }}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="max-h-[calc(100vh-11rem)] overflow-hidden py-0 lg:sticky lg:top-4">
          <CardContent className="h-full px-0">
            <AgentPanel
              proposalId={proposal.id}
              context={context}
              thread={proposal.messages.map((m) => ({
                id: m.id,
                author: m.author,
                text: m.text,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
