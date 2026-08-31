import { requireSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/dashboard/stat-tile";
import { HorizontalBarChart } from "@/components/dashboard/horizontal-bar-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StaleDealsList } from "@/components/dashboard/stale-deals-list";
import { formatCurrency, formatPercent, SERVICE_TYPE_LABELS } from "@/lib/format";
import {
  getOverviewStats,
  getFunnel,
  getLossReasonBreakdown,
  getSourceBreakdown,
  getServiceTypeBreakdown,
  getRevenueByMonth,
  getStaleDeals,
} from "@/lib/metrics";

export default async function DashboardPage() {
  const { organizationId } = await requireSession();

  const [stats, funnel, lossReasons, sources, serviceTypes, revenue, staleDeals] = await Promise.all([
    getOverviewStats(organizationId),
    getFunnel(organizationId),
    getLossReasonBreakdown(organizationId),
    getSourceBreakdown(organizationId),
    getServiceTypeBreakdown(organizationId),
    getRevenueByMonth(organizationId),
    getStaleDeals(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Conversão, receita e saúde do pipeline"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Taxa de conversão"
          value={formatPercent(stats.winRate)}
          hint={`${stats.wonCount} ganhos de ${stats.wonCount + stats.lostCount} fechados`}
          accent
        />
        <StatTile
          label="Negócios abertos"
          value={String(stats.openCount)}
          hint={formatCurrency(stats.openValue)}
        />
        <StatTile
          label="Ganhos"
          value={String(stats.wonCount)}
          hint={formatCurrency(stats.wonValue)}
        />
        <StatTile
          label="Perdidos"
          value={String(stats.lostCount)}
          hint={`ticket médio ${formatCurrency(stats.avgTicket)}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita ganha (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Funil de conversão por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={funnel.map((f) => ({ label: f.name, value: f.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Motivos de perda mais comuns</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={lossReasons.map((r) => ({ label: r.label, value: r.count }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Negócios por origem</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={sources.map((s) => ({ label: s.label, value: s.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Negócios por tipo de serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={serviceTypes.map((s) => ({
                label: SERVICE_TYPE_LABELS[s.label] ?? s.label,
                value: s.count,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Negócios sem contato recente</CardTitle>
          </CardHeader>
          <CardContent>
            <StaleDealsList deals={staleDeals} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
