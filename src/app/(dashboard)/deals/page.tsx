import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { DealsBoard, type BoardStage } from "@/components/deals/deals-board";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { PageHeader } from "@/components/page-header";

export default async function DealsPage() {
  const { organizationId } = await requireSession();

  const [stages, contacts, companies, lossReasons] = await Promise.all([
    db.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { order: "asc" },
      include: {
        deals: {
          orderBy: { createdAt: "desc" },
          include: {
            contact: { select: { name: true } },
            company: { select: { name: true } },
          },
        },
      },
    }),
    db.contact.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.company.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.lossReason.findMany({ where: { organizationId }, select: { id: true, label: true } }),
  ]);

  const boardStages: BoardStage[] = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    type: stage.type,
    deals: stage.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: Number(deal.value),
      currency: deal.currency,
      serviceType: deal.serviceType,
      contactName: deal.contact?.name ?? null,
      companyName: deal.company?.name ?? null,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negócios"
        description="Arraste os cards entre as etapas para mover o pipeline"
        action={<DealFormDialog contacts={contacts} companies={companies} />}
      />
      <DealsBoard initialStages={boardStages} lossReasons={lossReasons} />
    </div>
  );
}
