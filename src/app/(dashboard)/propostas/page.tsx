import Link from "next/link";
import { FileText, Eye } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { ProposalStatusBadge } from "@/components/proposals/status-badge";
import { ProposalFormDialog } from "@/components/proposals/proposal-form-dialog";
import { ActionIconButton } from "@/components/action-icon-button";
import { deleteProposalAction } from "@/server/proposals";
import { formatCents } from "@/lib/format";
import { Trash2 } from "lucide-react";

export default async function PropostasPage() {
  const { organizationId } = await requireSession();

  const [proposals, deals] = await Promise.all([
    db.proposal.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        company: { select: { name: true } },
        deal: { select: { title: true } },
        _count: { select: { blocks: true } },
      },
    }),
    db.deal.findMany({
      where: { organizationId, status: "OPEN" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const inPlay = proposals
    .filter((p) => !["REJECTED"].includes(p.status))
    .reduce((sum, p) => sum + p.valueCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Propostas"
        description={
          proposals.length === 0
            ? "Documentos comerciais escritos com apoio do agente"
            : `${proposals.length} ${proposals.length === 1 ? "proposta" : "propostas"} · ${formatCents(inPlay)} em jogo`
        }
        action={<ProposalFormDialog deals={deals} />}
      />

      {proposals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhuma proposta ainda</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie uma a partir de um negócio: o agente usa o histórico de conversas e o
              valor negociado para escrever os blocos.
            </p>
          </div>
          <ProposalFormDialog deals={deals} />
        </div>
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Aberturas</TableHead>
                  <TableHead>Atualizada</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Link
                        href={`/propostas/${proposal.slug}`}
                        className="flex flex-col gap-0.5"
                      >
                        <span className="font-medium">{proposal.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {proposal.company?.name ??
                            proposal.deal?.title ??
                            "Sem negócio vinculado"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ProposalStatusBadge status={proposal.status} />
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {formatCents(proposal.valueCents, proposal.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {proposal.sentAt ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground tabular">
                          <Eye className="h-3.5 w-3.5" />
                          {proposal.views}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular">
                      {proposal.updatedAt.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <ActionIconButton
                        action={deleteProposalAction.bind(null, proposal.id)}
                        confirmMessage={`Excluir a proposta "${proposal.title}"?`}
                        className="text-muted-foreground hover:text-destructive"
                        label={`Excluir ${proposal.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </ActionIconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
