/**
 * Exercita contra um MongoDB de verdade (em memória) toda consulta que o app
 * faz, para descobrir o que só quebra em runtime — filtros por relação,
 * agregações, cascatas emuladas, índices únicos.
 *
 * Sobe como replica set porque é o único modo em que dá para comparar o
 * comportamento com e sem transação. Rode com `npm run smoke:mongo`.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { execSync } from "node:child_process";

const fails: string[] = [];
const warns: string[] = [];

async function check(label: string, fn: () => Promise<unknown>) {
  try {
    const out = await fn();
    console.log(`  OK    ${label}${out === undefined ? "" : `  -> ${String(out)}`}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`  FALHA ${label}\n          ${msg}`);
    fails.push(`${label}: ${msg}`);
  }
}

async function main() {
  console.log("Subindo MongoDB em memória (replica set)...");
  const replset = await MongoMemoryReplSet.create({ replSet: { count: 1, name: "smokeRS" } });
  const uri = `${replset.getUri()}crm_smoke?replicaSet=smokeRS`;
  console.log(`  uri: ${uri.replace(/\/\/.*@/, "//")}\n`);

  process.env.DATABASE_URL = uri;

  console.log("Aplicando o schema com prisma db push...");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: uri },
    stdio: "pipe",
  });
  console.log("  schema aplicado\n");

  const { PrismaClient } = await import("../src/generated/prisma/client");
  const db = new PrismaClient({ datasources: { db: { url: uri } } });

  const { createOrganizationWithOwner } = await import("../src/server/organizations");
  const bcrypt = (await import("bcryptjs")).default;

  console.log("--- Cadastro e organização ---");
  const user = await db.user.create({
    data: { name: "Smoke", email: "smoke@test.local", passwordHash: await bcrypt.hash("x".repeat(10), 10) },
  });
  const org = await createOrganizationWithOwner({ organizationName: "Smoke Org", userId: user.id });
  await check("seed de etapas e motivos", async () => {
    const s = await db.pipelineStage.count({ where: { organizationId: org.id } });
    const r = await db.lossReason.count({ where: { organizationId: org.id } });
    if (s !== 6 || r !== 6) throw new Error(`esperado 6/6, veio ${s}/${r}`);
    return `${s} etapas, ${r} motivos`;
  });

  await check("índice único [organizationId, order] barra duplicata", async () => {
    try {
      await db.pipelineStage.create({
        data: { organizationId: org.id, name: "Duplicada", order: 0 },
      });
      throw new Error("DUPLICATA ACEITA — índice único não está valendo");
    } catch (e) {
      if (e instanceof Error && e.message.includes("DUPLICATA ACEITA")) throw e;
      return "rejeitou como esperado";
    }
  });

  const stages = await db.pipelineStage.findMany({
    where: { organizationId: org.id },
    orderBy: { order: "asc" },
  });
  const company = await db.company.create({ data: { organizationId: org.id, name: "Cliente" } });
  const contact = await db.contact.create({
    data: { organizationId: org.id, companyId: company.id, name: "Contato", source: "Indicação" },
  });
  const deal = await db.deal.create({
    data: {
      organizationId: org.id, title: "Negócio", companyId: company.id, contactId: contact.id,
      stageId: stages[0].id, valueCents: 1_500_000, serviceType: "SAAS",
    },
  });
  await db.stageHistory.create({ data: { dealId: deal.id, toStageId: stages[0].id } });
  await db.activity.create({
    data: { organizationId: org.id, dealId: deal.id, type: "NOTE", body: "nota", createdByUserId: user.id },
  });

  console.log("\n--- Consultas do dashboard ---");
  const m = await import("../src/lib/metrics");
  await check("getOverviewStats (aggregate + _sum)", async () => {
    const s = await m.getOverviewStats(org.id);
    if (s.openValue !== 1_500_000) throw new Error(`openValue=${s.openValue}, esperado 1500000`);
    return `abertos=${s.openCount} valor=${s.openValue}c`;
  });
  await check("getFunnel (FILTRO POR RELAÇÃO toStage.organizationId)", async () => {
    const f = await m.getFunnel(org.id);
    const lead = f.find((x) => x.name === "Lead");
    if (!lead || lead.count !== 1) throw new Error(`Lead=${lead?.count}, esperado 1`);
    return `${f.length} etapas, Lead=${lead.count}`;
  });
  await check("getFunnelColumns", async () => (await m.getFunnelColumns(org.id)).stages.length + " colunas");
  await check("getLossReasonBreakdown (groupBy)", async () => (await m.getLossReasonBreakdown(org.id)).length + " motivos");
  await check("getSourceBreakdown", async () => (await m.getSourceBreakdown(org.id)).map((s) => s.label).join(","));
  await check("getServiceTypeBreakdown (groupBy)", async () => (await m.getServiceTypeBreakdown(org.id)).map((s) => `${s.label}=${s.count}`).join(","));
  await check("getRevenueByMonth", async () => (await m.getRevenueByMonth(org.id)).length + " meses");
  await check("getStaleDeals", async () => (await m.getStaleDeals(org.id)).length + " parados");
  await check("getAvgDaysPerStage (FILTRO POR RELAÇÃO)", async () => (await m.getAvgDaysPerStage(org.id)).length + " etapas");

  console.log("\n--- _count aninhado nas páginas ---");
  await check("company._count (contacts, deals)", async () => {
    const c = await db.company.findFirstOrThrow({
      where: { organizationId: org.id },
      include: { _count: { select: { contacts: true, deals: true } } },
    });
    return `contatos=${c._count.contacts} negocios=${c._count.deals}`;
  });
  await check("idea.groupBy com _count: true", async () => {
    await db.idea.create({ data: { organizationId: org.id, title: "Ideia", createdByUserId: user.id } });
    const g = await db.idea.groupBy({ by: ["status"], where: { organizationId: org.id }, _count: true });
    const total = g.reduce((sum, x) => sum + x._count, 0);
    if (total !== 1) throw new Error(`total=${total}, esperado 1`);
    return `total=${total}`;
  });

  console.log("\n--- Propostas ---");
  const { DEFAULT_BLOCKS } = await import("../src/lib/proposal-blocks");
  const proposal = await db.proposal.create({
    data: {
      organizationId: org.id, title: "Proposta", slug: "proposta", dealId: deal.id,
      companyId: company.id, valueCents: 1_500_000,
      blocks: { create: DEFAULT_BLOCKS.map((b, order) => ({ order, label: b.label })) },
    },
  });
  await check("proposta com blocos aninhados", async () =>
    (await db.proposalBlock.count({ where: { proposalId: proposal.id } })) + " blocos");
  await check("bloco por FILTRO POR RELAÇÃO proposal.organizationId", async () => {
    const b = await db.proposalBlock.findFirst({
      where: { proposalId: proposal.id, proposal: { organizationId: org.id } },
      include: { proposal: { select: { slug: true } } },
    });
    if (!b) throw new Error("filtro por relação não achou o bloco");
    return `achou "${b.label}"`;
  });
  await check("proposta com include profundo (deal.contact + _count)", async () => {
    const p = await db.proposal.findFirstOrThrow({
      where: { slug: "proposta", organizationId: org.id },
      include: {
        blocks: { orderBy: { order: "asc" } },
        messages: { orderBy: { createdAt: "asc" } },
        company: { select: { name: true } },
        deal: { select: { title: true, contact: { select: { name: true } }, _count: { select: { activities: true } } } },
      },
    });
    return `${p.blocks.length} blocos, deal.contact=${p.deal?.contact?.name}`;
  });

  console.log("\n--- Escritas sequenciais que substituíram transações ---");
  const { moveDealStageAction } = await import("../src/server/deals");
  void moveDealStageAction; // exige sessão; validamos o efeito no banco abaixo
  await check("troca de ordem de etapas via -1 (sem transação)", async () => {
    const [a, b] = stages;
    await db.pipelineStage.update({ where: { id: a.id }, data: { order: -1 } });
    await db.pipelineStage.update({ where: { id: b.id }, data: { order: a.order } });
    await db.pipelineStage.update({ where: { id: a.id }, data: { order: b.order } });
    const after = await db.pipelineStage.findMany({ where: { organizationId: org.id }, orderBy: { order: "asc" } });
    if (after[0].id !== b.id) throw new Error("ordem não trocou");
    return `${after[0].name} agora é a primeira`;
  });

  console.log("\n--- Cascatas emuladas ---");
  await check("excluir etapa cascateia StageHistory", async () => {
    const s = await db.pipelineStage.create({ data: { organizationId: org.id, name: "Temp", order: 99 } });
    const d2 = await db.deal.create({
      data: { organizationId: org.id, title: "D2", stageId: s.id, valueCents: 100 },
    });
    await db.stageHistory.create({ data: { dealId: d2.id, toStageId: s.id } });
    await db.deal.delete({ where: { id: d2.id } });
    await db.pipelineStage.delete({ where: { id: s.id } });
    const left = await db.stageHistory.count({ where: { toStageId: s.id } });
    if (left !== 0) throw new Error(`sobraram ${left} registros de historico`);
    return "histórico removido junto";
  });
  await check("excluir organização cascateia tudo", async () => {
    const u2 = await db.user.create({
      data: { name: "T", email: "t2@test.local", passwordHash: "x" },
    });
    const o2 = await createOrganizationWithOwner({ organizationName: "Para Apagar", userId: u2.id });
    await db.organization.delete({ where: { id: o2.id } });
    const s = await db.pipelineStage.count({ where: { organizationId: o2.id } });
    const r = await db.lossReason.count({ where: { organizationId: o2.id } });
    if (s + r !== 0) throw new Error(`sobraram ${s} etapas e ${r} motivos`);
    return "etapas e motivos removidos";
  });

  console.log("\n--- Transação (só funciona com replica set) ---");
  await check("$transaction disponível neste MongoDB", async () => {
    await db.$transaction([
      db.company.create({ data: { organizationId: org.id, name: "Tx A" } }),
      db.company.create({ data: { organizationId: org.id, name: "Tx B" } }),
    ]);
    return "funcionou (este mongod é replica set)";
  });

  await db.$disconnect();
  await replset.stop();

  console.log("\n=======================================");
  if (fails.length === 0) {
    console.log(`  TODAS AS ${0} VERIFICAÇÕES PASSARAM`.replace("0", "s"));
  } else {
    console.log(`  ${fails.length} FALHA(S):`);
    for (const f of fails) console.log(`   - ${f}`);
  }
  for (const w of warns) console.log(`  aviso: ${w}`);
  console.log("=======================================");
  if (fails.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ERRO FATAL:", e);
  process.exitCode = 1;
});
