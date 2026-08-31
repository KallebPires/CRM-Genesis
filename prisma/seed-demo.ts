import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { createOrganizationWithOwner } from "../src/server/organizations";

const DEMO_EMAIL = "demo@genesis.dev";
const DEMO_PASSWORD = "genesis2026";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  console.log("Limpando demo anterior (se existir)...");
  const prior = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (prior) {
    const orgs = await db.organizationMembership.findMany({
      where: { userId: prior.id },
      select: { organizationId: true },
    });
    for (const { organizationId } of orgs) {
      await db.deal.deleteMany({ where: { organizationId } });
      await db.organization.delete({ where: { id: organizationId } });
    }
    await db.activity.deleteMany({ where: { createdByUserId: prior.id } });
    await db.user.delete({ where: { id: prior.id } });
  }

  console.log("Criando conta demo...");
  const user = await db.user.create({
    data: {
      name: "Kalleb Pires",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });
  const org = await createOrganizationWithOwner({
    organizationName: "Genesis",
    userId: user.id,
  });

  const stages = await db.pipelineStage.findMany({
    where: { organizationId: org.id },
    orderBy: { order: "asc" },
  });
  const reasons = await db.lossReason.findMany({ where: { organizationId: org.id } });
  const stage = (name: string) => stages.find((s) => s.name === name)!;
  const reason = (label: string) => reasons.find((r) => r.label === label)!;

  console.log("Criando empresas e contatos...");
  const companySpecs: [string, string, string][] = [
    ["Padaria Trigo de Ouro", "https://trigodeouro.com.br", "Indicação"],
    ["Clínica Vitalis", "https://clinicavitalis.com.br", "Site"],
    ["TransLog Cargas", "https://translog.com.br", "LinkedIn"],
    ["EduMais Cursos", "https://edumais.com.br", "Indicação"],
    ["AgroSul Sementes", "https://agrosul.com.br", "Outbound"],
    ["Studio Bellara", "https://bellara.com.br", "Instagram"],
    ["Contabiliza+", "https://contabilizamais.com.br", "Indicação"],
    ["MoveFit Academias", "https://movefit.com.br", "LinkedIn"],
  ];

  const contactNames = [
    "Marcos Almeida",
    "Renata Prado",
    "Cláudio Bessa",
    "Juliana Rocha",
    "Fernando Tavares",
    "Bianca Correia",
    "Rogério Lima",
    "Patrícia Nunes",
  ];

  const companies = [];
  const contacts = [];
  for (let i = 0; i < companySpecs.length; i++) {
    const [name, website, source] = companySpecs[i];
    const company = await db.company.create({
      data: { organizationId: org.id, name, website },
    });
    const contact = await db.contact.create({
      data: {
        organizationId: org.id,
        companyId: company.id,
        name: contactNames[i],
        email: `contato@${website.replace("https://", "")}`,
        phone: `(11) 9${1000 + i}-${2000 + i}`,
        role: i % 2 === 0 ? "Sócio-proprietário" : "Diretor de Operações",
        source,
      },
    });
    companies.push(company);
    contacts.push(contact);
  }

  console.log("Criando negocios pelo pipeline...");
  type DealSpec = {
    title: string;
    idx: number;
    stageName: string;
    value: number;
    serviceType: "SITE" | "SAAS" | "ERP" | "AUTOMACAO" | "IA" | "OUTRO";
    createdDaysAgo: number;
    closedMonthsAgo?: number;
    lostReason?: string;
  };

  const dealSpecs: DealSpec[] = [
    // --- Em aberto, espalhados pelo funil ---
    { title: "Site institucional + blog", idx: 0, stageName: "Lead", value: 8500, serviceType: "SITE", createdDaysAgo: 3 },
    { title: "Portal do aluno (SaaS)", idx: 3, stageName: "Lead", value: 62000, serviceType: "SAAS", createdDaysAgo: 21 },
    { title: "Automação de agendamento", idx: 1, stageName: "Contato Feito", value: 14000, serviceType: "AUTOMACAO", createdDaysAgo: 12 },
    { title: "App de rastreio de frota", idx: 2, stageName: "Contato Feito", value: 78000, serviceType: "SAAS", createdDaysAgo: 34 },
    { title: "ERP de estoque e vendas", idx: 4, stageName: "Proposta Enviada", value: 145000, serviceType: "ERP", createdDaysAgo: 18 },
    { title: "E-commerce headless", idx: 5, stageName: "Proposta Enviada", value: 47000, serviceType: "SITE", createdDaysAgo: 9 },
    { title: "Agente de IA para atendimento", idx: 6, stageName: "Negociação", value: 96000, serviceType: "IA", createdDaysAgo: 27 },
    { title: "Plataforma de gestão de alunos", idx: 7, stageName: "Negociação", value: 210000, serviceType: "SAAS", createdDaysAgo: 41 },

    // --- Ganhos, distribuidos nos ultimos meses (alimenta o grafico de receita) ---
    { title: "Landing page campanha verão", idx: 5, stageName: "Ganho", value: 6800, serviceType: "SITE", createdDaysAgo: 160, closedMonthsAgo: 5 },
    { title: "Integração ERP ↔ marketplace", idx: 4, stageName: "Ganho", value: 38000, serviceType: "AUTOMACAO", createdDaysAgo: 130, closedMonthsAgo: 4 },
    { title: "Site institucional Vitalis", idx: 1, stageName: "Ganho", value: 12500, serviceType: "SITE", createdDaysAgo: 105, closedMonthsAgo: 3 },
    { title: "Dashboard de indicadores", idx: 2, stageName: "Ganho", value: 54000, serviceType: "SAAS", createdDaysAgo: 95, closedMonthsAgo: 3 },
    { title: "Chatbot de triagem com IA", idx: 6, stageName: "Ganho", value: 72000, serviceType: "IA", createdDaysAgo: 70, closedMonthsAgo: 2 },
    { title: "Portal de pedidos B2B", idx: 0, stageName: "Ganho", value: 89000, serviceType: "SAAS", createdDaysAgo: 45, closedMonthsAgo: 1 },
    { title: "Automação de notas fiscais", idx: 6, stageName: "Ganho", value: 26000, serviceType: "AUTOMACAO", createdDaysAgo: 20, closedMonthsAgo: 0 },

    // --- Perdidos, com motivos variados ---
    { title: "Reformulação de marca + site", idx: 5, stageName: "Perdido", value: 22000, serviceType: "SITE", createdDaysAgo: 120, closedMonthsAgo: 3, lostReason: "Preço" },
    { title: "ERP financeiro completo", idx: 7, stageName: "Perdido", value: 180000, serviceType: "ERP", createdDaysAgo: 110, closedMonthsAgo: 3, lostReason: "Preço" },
    { title: "App mobile de delivery", idx: 0, stageName: "Perdido", value: 65000, serviceType: "SAAS", createdDaysAgo: 88, closedMonthsAgo: 2, lostReason: "Concorrente" },
    { title: "Sistema de reservas", idx: 3, stageName: "Perdido", value: 31000, serviceType: "SAAS", createdDaysAgo: 75, closedMonthsAgo: 2, lostReason: "Timing" },
    { title: "Consultoria de arquitetura", idx: 2, stageName: "Perdido", value: 18000, serviceType: "OUTRO", createdDaysAgo: 60, closedMonthsAgo: 1, lostReason: "Sumiu / sem resposta" },
    { title: "Integração com ERP legado", idx: 4, stageName: "Perdido", value: 44000, serviceType: "AUTOMACAO", createdDaysAgo: 40, closedMonthsAgo: 1, lostReason: "Preço" },
  ];

  const openStageOrder = ["Lead", "Contato Feito", "Proposta Enviada", "Negociação"];
  const createdDeals: { id: string; title: string; createdDaysAgo: number }[] = [];

  for (const spec of dealSpecs) {
    const target = stage(spec.stageName);
    const isClosed = target.type !== "OPEN";
    const createdAt = daysAgo(spec.createdDaysAgo);

    const deal = await db.deal.create({
      data: {
        organizationId: org.id,
        title: spec.title,
        contactId: contacts[spec.idx].id,
        companyId: companies[spec.idx].id,
        stageId: target.id,
        value: spec.value,
        serviceType: spec.serviceType,
        status: target.type,
        createdAt,
        lostReasonId: spec.lostReason ? reason(spec.lostReason).id : null,
        closedAt: isClosed ? monthsAgo(spec.closedMonthsAgo ?? 0) : null,
        expectedCloseDate: isClosed ? null : daysAgo(-15),
      },
    });

    // Walk the deal through the funnel so StageHistory feeds the funnel chart.
    const path = isClosed
      ? [...openStageOrder, spec.stageName]
      : openStageOrder.slice(0, openStageOrder.indexOf(spec.stageName) + 1);

    let previousId: string | null = null;
    for (let i = 0; i < path.length; i++) {
      const s = stage(path[i]);
      await db.stageHistory.create({
        data: {
          dealId: deal.id,
          fromStageId: previousId,
          toStageId: s.id,
          changedAt: daysAgo(spec.createdDaysAgo - i * 2),
        },
      });
      previousId = s.id;
    }

    createdDeals.push({ id: deal.id, title: spec.title, createdDaysAgo: spec.createdDaysAgo });
  }

  console.log("Criando atividades...");
  const activitySpecs: [string, "NOTE" | "CALL" | "EMAIL" | "MEETING" | "TASK", string, number][] = [
    ["Site institucional + blog", "CALL", "Ligação inicial. Querem sair do WordPress, foco em velocidade.", 2],
    ["Site institucional + blog", "NOTE", "Orçamento entre 8k e 10k. Decisor é o próprio dono.", 1],
    ["Automação de agendamento", "MEETING", "Reunião de descoberta feita. Integrar com Google Agenda.", 5],
    ["Automação de agendamento", "TASK", "Enviar proposta comercial revisada", -2],
    ["ERP de estoque e vendas", "EMAIL", "Enviada proposta com 3 módulos e cronograma de 4 meses.", 6],
    ["ERP de estoque e vendas", "TASK", "Follow-up da proposta", -1],
    ["Agente de IA para atendimento", "MEETING", "Demo do agente rodando. Gostaram do tempo de resposta.", 4],
    ["Agente de IA para atendimento", "NOTE", "Pediram case de cliente similar antes de fechar.", 3],
    ["Plataforma de gestão de alunos", "CALL", "Negociando escopo — querem cortar o módulo financeiro na v1.", 8],
    ["E-commerce headless", "EMAIL", "Proposta enviada. Aguardando retorno do time de marketing.", 7],
  ];

  for (const [dealTitle, type, body, dueOffset] of activitySpecs) {
    const deal = createdDeals.find((d) => d.title === dealTitle);
    if (!deal) continue;
    await db.activity.create({
      data: {
        organizationId: org.id,
        dealId: deal.id,
        type,
        body,
        createdByUserId: user.id,
        createdAt: daysAgo(Math.abs(dueOffset)),
        dueAt: type === "TASK" ? daysAgo(dueOffset) : null,
      },
    });
  }

  // "App de rastreio de frota" and "Portal do aluno" get no activity at all,
  // so they surface in the "sem contato recente" widget.

  const openCount = await db.deal.count({ where: { organizationId: org.id, status: "OPEN" } });
  const wonCount = await db.deal.count({ where: { organizationId: org.id, status: "WON" } });
  const lostCount = await db.deal.count({ where: { organizationId: org.id, status: "LOST" } });

  console.log("\n=======================================");
  console.log("  CONTA DEMO PRONTA");
  console.log("=======================================");
  console.log(`  URL:    http://localhost:3000/login`);
  console.log(`  E-mail: ${DEMO_EMAIL}`);
  console.log(`  Senha:  ${DEMO_PASSWORD}`);
  console.log("---------------------------------------");
  console.log(`  ${openCount} negocios abertos`);
  console.log(`  ${wonCount} ganhos / ${lostCount} perdidos`);
  console.log(`  ${companies.length} empresas e contatos`);
  console.log("=======================================\n");
}

main()
  .catch((e) => {
    console.error("FALHOU:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
