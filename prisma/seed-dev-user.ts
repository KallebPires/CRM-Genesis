/**
 * Cria (ou recria) a conta de acesso para desenvolvimento.
 *
 * Se já existir uma organização, o usuário de dev entra nela como ADMIN em vez
 * de criar outra — o app é multi-tenant, e uma segunda organização seria um
 * tenant separado, sem enxergar nenhum dado do primeiro. Só cria organização
 * quando o banco está vazio.
 *
 * Rode com `npm run seed:dev`. É idempotente.
 * Para dados de demonstração, use `npm run seed:demo`.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { createOrganizationWithOwner } from "../src/server/organizations";

const EMAIL = "dev@genesis.local";
const PASSWORD = "genesis2026";
const USER_NAME = "Dev Genesis";
const ORG_NAME = "Genesis";

async function main() {
  // Remove a conta anterior e qualquer organização que ela tenha criado sozinha.
  const existing = await db.user.findUnique({
    where: { email: EMAIL },
    include: {
      memberships: {
        select: {
          organizationId: true,
          organization: { select: { _count: { select: { memberships: true } } } },
        },
      },
    },
  });

  if (existing) {
    for (const m of existing.memberships) {
      // Só apaga a organização se ela existir apenas para esta conta.
      if (m.organization._count.memberships === 1) {
        await db.deal.deleteMany({ where: { organizationId: m.organizationId } });
        await db.proposal.deleteMany({ where: { organizationId: m.organizationId } });
        await db.organization.delete({ where: { id: m.organizationId } });
      }
    }
    await db.user.delete({ where: { id: existing.id } });
    console.log("Conta de dev anterior removida.");
  }

  const user = await db.user.create({
    data: {
      name: USER_NAME,
      email: EMAIL,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
    },
  });

  const host = await db.organization.findFirst({ orderBy: { createdAt: "asc" } });

  let org;
  let joined = false;
  if (host) {
    await db.organizationMembership.create({
      data: { userId: user.id, organizationId: host.id, role: "ADMIN" },
    });
    org = host;
    joined = true;
  } else {
    org = await createOrganizationWithOwner({ organizationName: ORG_NAME, userId: user.id });
  }

  const [stages, reasons, deals, members] = await Promise.all([
    db.pipelineStage.count({ where: { organizationId: org.id } }),
    db.lossReason.count({ where: { organizationId: org.id } }),
    db.deal.count({ where: { organizationId: org.id } }),
    db.organizationMembership.count({ where: { organizationId: org.id } }),
  ]);

  console.log("\n=======================================");
  console.log("  CONTA DE DESENVOLVIMENTO");
  console.log("=======================================");
  console.log(`  URL:    http://localhost:3000/login`);
  console.log(`  E-mail: ${EMAIL}`);
  console.log(`  Senha:  ${PASSWORD}`);
  console.log("---------------------------------------");
  console.log(
    joined
      ? `  Entrou na organização existente "${org.name}" como ADMIN`
      : `  Organização "${org.name}" criada (banco estava vazio)`
  );
  console.log(`  ${members} membros · ${stages} etapas · ${reasons} motivos`);
  console.log(`  ${deals} negócios no pipeline`);
  console.log("=======================================\n");
}

main()
  .catch((error) => {
    console.error("FALHOU:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
