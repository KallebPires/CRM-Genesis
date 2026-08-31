import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { DeleteButton } from "@/components/delete-button";
import { ActivityForm } from "@/components/deals/activity-form";
import { ActivityTimeline } from "@/components/deals/activity-timeline";
import { deleteDealAction } from "@/server/deals";
import { formatCents, toReais, SERVICE_TYPE_LABELS } from "@/lib/format";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireSession();

  const deal = await db.deal.findFirst({
    where: { id, organizationId },
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true } },
      company: { select: { id: true, name: true } },
      stage: true,
      lostReason: true,
      activities: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  if (!deal) notFound();

  const [contacts, companies] = await Promise.all([
    db.contact.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.company.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const statusVariant =
    deal.status === "WON" ? "default" : deal.status === "LOST" ? "destructive" : "secondary";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para negócios
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-xl">{deal.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant}>{deal.stage.name}</Badge>
              <Badge variant="outline">{SERVICE_TYPE_LABELS[deal.serviceType] ?? deal.serviceType}</Badge>
              {deal.lostReason ? <Badge variant="destructive">{deal.lostReason.label}</Badge> : null}
            </div>
          </div>
          <div className="flex gap-1">
            <DealFormDialog
              contacts={contacts}
              companies={companies}
              deal={{
                id: deal.id,
                title: deal.title,
                contactId: deal.contactId,
                companyId: deal.companyId,
                value: toReais(deal.valueCents),
                serviceType: deal.serviceType,
                expectedCloseDate: deal.expectedCloseDate
                  ? deal.expectedCloseDate.toISOString().slice(0, 10)
                  : null,
              }}
              trigger={<Button variant="outline">Editar</Button>}
            />
            <DeleteButton
              action={deleteDealAction.bind(null, deal.id)}
              confirmMessage={`Excluir o negócio "${deal.title}"?`}
            />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Valor</p>
            <p className="font-medium">{formatCents(deal.valueCents, deal.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Empresa</p>
            <p className="font-medium">{deal.company?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contato</p>
            <p className="font-medium">{deal.contact?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Previsão de fechamento</p>
            <p className="font-medium">
              {deal.expectedCloseDate ? deal.expectedCloseDate.toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActivityForm dealId={deal.id} />
          <ActivityTimeline dealId={deal.id} activities={deal.activities} />
        </CardContent>
      </Card>
    </div>
  );
}
