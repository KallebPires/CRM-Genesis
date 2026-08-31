import { requireSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { MonthBars } from "@/components/viz/month-bars";
import { Donut, DonutRows, DonutRow } from "@/components/viz/donut";
import { DistList } from "@/components/viz/dist-list";
import { formatCents, SERVICE_TYPE_LABELS } from "@/lib/format";
import {
  getOverviewStats,
  getRevenueByMonth,
  getServiceTypeBreakdown,
} from "@/lib/metrics";

export default async function ReceitaPage() {
  const { organizationId } = await requireSession();

  const [stats, revenue, serviceTypes] = await Promise.all([
    getOverviewStats(organizationId),
    getRevenueByMonth(organizationId),
    getServiceTypeBreakdown(organizationId),
  ]);

  const range =
    revenue.length > 0
      ? `${revenue[0].label} — ${revenue[revenue.length - 1].label}`
      : "";
  const totalDeals = stats.openCount + stats.wonCount + stats.lostCount;

  return (
    <div className="space-y-4">
      <PageHeader title="Receita" description="Quanto entrou, de onde e em que serviço" />

      <Card className="py-4">
        <CardContent className="flex min-h-[300px] flex-col px-[18px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="font-heading text-[13px] font-semibold tracking-tight">
                Receita ganha
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-[1.875rem] font-semibold leading-none tracking-tight tabular">
                  {formatCents(stats.wonValue)}
                </span>
                <span className="text-[12.5px] text-muted-foreground">
                  nos últimos 6 meses
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">{range}</span>
          </div>
          <div className="mt-4 flex-1">
            <RevenueChart data={revenue} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1.1fr_1fr]">
        <Card className="py-4">
          <CardContent className="flex min-h-[220px] flex-col px-[18px]">
            <SectionHeader title="Receita por mês" meta="R$" />
            <MonthBars data={revenue} />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex min-h-[220px] items-center gap-5 px-[18px]">
            <Donut value={Math.round(stats.winRate * 100)} label="Conversão" />
            <DonutRows>
              <DonutRow
                label="Abertos"
                value={stats.openCount}
                meta={formatCents(stats.openValue)}
              />
              <DonutRow
                label="Ganhos"
                value={stats.wonCount}
                meta={formatCents(stats.wonValue)}
                dot="success"
              />
              <DonutRow
                label="Perdidos"
                value={stats.lostCount}
                meta={`ticket ${formatCents(stats.avgTicket)}`}
                dot="danger"
                divider={false}
              />
            </DonutRows>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex min-h-[220px] flex-col px-[18px]">
            <SectionHeader title="Tipo de serviço" meta={`${totalDeals} negócios`} />
            <DistList
              items={serviceTypes.map((s) => ({
                label: SERVICE_TYPE_LABELS[s.label] ?? s.label,
                count: s.count,
              }))}
              emptyMessage="Nenhum negócio cadastrado ainda."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
