import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StageSettings } from "@/components/settings/stage-settings";
import { LossReasonSettings } from "@/components/settings/loss-reason-settings";
import { TeamSettings } from "@/components/settings/team-settings";

export default async function SettingsPage() {
  const { organizationId } = await requireSession();

  const [stages, lossReasons, members] = await Promise.all([
    db.pipelineStage.findMany({ where: { organizationId }, orderBy: { order: "asc" } }),
    db.lossReason.findMany({ where: { organizationId }, orderBy: { label: "asc" } }),
    db.organizationMembership.findMany({
      where: { organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Pipeline, motivos de perda e equipe"
      />

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="loss-reasons">Motivos de perda</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Etapas do pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StageSettings stages={stages} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loss-reasons">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Motivos de perda</CardTitle>
            </CardHeader>
            <CardContent>
              <LossReasonSettings lossReasons={lossReasons} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamSettings members={members} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
