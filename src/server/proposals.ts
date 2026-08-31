"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { formatCents, SERVICE_TYPE_LABELS } from "@/lib/format";
import { DEFAULT_BLOCKS } from "@/lib/proposal-blocks";
import { getAnthropic, AGENT_MODEL, textFrom, MissingAnthropicKeyError } from "@/lib/anthropic";

const SYSTEM = `Você escreve propostas comerciais para a Genesis, uma software house
brasileira da serra gaúcha que constrói sites, SaaS, ERP, automações e soluções de IA.

Regras:
- Escreva em português do Brasil, em tom direto e profissional, sem jargão de vendas.
- Nunca invente fatos sobre o cliente. Se faltar informação, escreva o que se sabe e
  aponte explicitamente a lacuna entre colchetes, ex.: [confirmar prazo com o cliente].
- Nada de superlativos vazios ("solução revolucionária", "parceria de sucesso").
- Prefira marcadores curtos a parágrafos longos.
- Responda apenas com o conteúdo do bloco pedido, sem título e sem preâmbulo.`;

async function uniqueSlug(organizationId: string, title: string) {
  const base = slugify(title) || "proposta";
  let candidate = base;
  let n = 1;
  while (
    await db.proposal.findFirst({ where: { organizationId, slug: candidate } })
  ) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

// --- CRUD -----------------------------------------------------------------

const createSchema = z.object({
  title: z.string().min(1, "Dê um título à proposta"),
  dealId: z.string().optional().or(z.literal("")),
});

export type ProposalState = { error?: string; fieldErrors?: { title?: string } };

export async function createProposalAction(
  _prev: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  const { organizationId } = await requireSession();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    dealId: formData.get("dealId") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: { title: parsed.error.issues[0]?.message } };
  }

  const deal = parsed.data.dealId
    ? await db.deal.findFirst({
        where: { id: parsed.data.dealId, organizationId },
        select: { id: true, companyId: true, valueCents: true, currency: true },
      })
    : null;

  await db.proposal.create({
    data: {
      organizationId,
      title: parsed.data.title,
      slug: await uniqueSlug(organizationId, parsed.data.title),
      dealId: deal?.id ?? null,
      companyId: deal?.companyId ?? null,
      valueCents: deal?.valueCents ?? 0,
      currency: deal?.currency ?? "BRL",
      blocks: {
        create: DEFAULT_BLOCKS.map((block, order) => ({
          order,
          label: block.label,
        })),
      },
    },
  });

  revalidatePath("/propostas");
  return {};
}

export async function deleteProposalAction(proposalId: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await db.proposal.deleteMany({ where: { id: proposalId, organizationId } });
  revalidatePath("/propostas");
  return {};
}

export async function setProposalStatusAction(
  proposalId: string,
  status: string
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const proposal = await db.proposal.findFirst({
    where: { id: proposalId, organizationId },
  });
  if (!proposal) return { error: "Proposta não encontrada" };

  await db.proposal.update({
    where: { id: proposalId },
    data: {
      status: status as never,
      // Marcar como enviada carimba a data na primeira vez.
      sentAt: status === "SENT" && !proposal.sentAt ? new Date() : proposal.sentAt,
    },
  });

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${proposal.slug}`);
  return {};
}

export async function updateBlockAction(
  blockId: string,
  content: string
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const block = await db.proposalBlock.findFirst({
    where: { id: blockId, proposal: { organizationId } },
    include: { proposal: { select: { slug: true } } },
  });
  if (!block) return { error: "Bloco não encontrado" };

  await db.proposalBlock.update({
    where: { id: blockId },
    data: { content, state: content.trim() ? "READY" : "EMPTY" },
  });

  revalidatePath(`/propostas/${block.proposal.slug}`);
  return {};
}

// --- Agente ---------------------------------------------------------------

/** Reúne tudo que o modelo precisa saber sobre o negócio por trás da proposta. */
async function buildContext(proposalId: string, organizationId: string) {
  const proposal = await db.proposal.findFirst({
    where: { id: proposalId, organizationId },
    include: {
      blocks: { orderBy: { order: "asc" } },
      company: { select: { name: true, website: true, notes: true } },
      deal: {
        select: {
          title: true,
          valueCents: true,
          currency: true,
          serviceType: true,
          expectedCloseDate: true,
          contact: { select: { name: true, role: true, source: true } },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { type: true, body: true, createdAt: true },
          },
        },
      },
    },
  });
  if (!proposal) return null;

  const lines: string[] = [`Proposta: ${proposal.title}`];
  if (proposal.company) {
    lines.push(`Empresa: ${proposal.company.name}`);
    if (proposal.company.website) lines.push(`Site: ${proposal.company.website}`);
    if (proposal.company.notes) lines.push(`Notas da empresa: ${proposal.company.notes}`);
  }
  if (proposal.deal) {
    lines.push(`Negócio: ${proposal.deal.title}`);
    lines.push(
      `Valor negociado: ${formatCents(proposal.deal.valueCents, proposal.deal.currency)}`
    );
    lines.push(
      `Tipo de serviço: ${SERVICE_TYPE_LABELS[proposal.deal.serviceType] ?? proposal.deal.serviceType}`
    );
    if (proposal.deal.expectedCloseDate) {
      lines.push(
        `Previsão de fechamento: ${proposal.deal.expectedCloseDate.toLocaleDateString("pt-BR")}`
      );
    }
    if (proposal.deal.contact) {
      lines.push(
        `Contato: ${proposal.deal.contact.name}${proposal.deal.contact.role ? ` (${proposal.deal.contact.role})` : ""}`
      );
    }
    if (proposal.deal.activities.length > 0) {
      lines.push("\nHistórico de conversas (mais recente primeiro):");
      for (const a of proposal.deal.activities) {
        lines.push(`- [${a.createdAt.toLocaleDateString("pt-BR")}] ${a.type}: ${a.body}`);
      }
    }
  } else {
    lines.push("(Esta proposta não está vinculada a nenhum negócio do CRM.)");
  }

  const filled = proposal.blocks.filter((b) => b.content?.trim());
  if (filled.length > 0) {
    lines.push("\nBlocos já escritos desta proposta:");
    for (const b of filled) lines.push(`\n## ${b.label}\n${b.content}`);
  }

  return { proposal, context: lines.join("\n") };
}

export async function generateBlockAction(
  blockId: string
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();

  const block = await db.proposalBlock.findFirst({
    where: { id: blockId, proposal: { organizationId } },
    include: { proposal: { select: { id: true, slug: true } } },
  });
  if (!block) return { error: "Bloco não encontrado" };

  const brief = DEFAULT_BLOCKS.find((b) => b.label === block.label)?.brief ?? "";

  await db.proposalBlock.update({
    where: { id: blockId },
    data: { state: "GENERATING" },
  });
  revalidatePath(`/propostas/${block.proposal.slug}`);

  try {
    const built = await buildContext(block.proposal.id, organizationId);
    if (!built) return { error: "Proposta não encontrada" };

    const message = await getAnthropic().beta.messages.create({
      model: AGENT_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${built.context}\n\n---\nEscreva o bloco "${block.label}" desta proposta. ${brief}`,
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      await db.proposalBlock.update({
        where: { id: blockId },
        data: { state: block.content?.trim() ? "READY" : "EMPTY" },
      });
      return { error: "O modelo recusou gerar este conteúdo." };
    }

    const text = textFrom(message as never);
    await db.proposalBlock.update({
      where: { id: blockId },
      data: { content: text, state: text ? "READY" : "EMPTY" },
    });

    revalidatePath(`/propostas/${block.proposal.slug}`);
    return {};
  } catch (error) {
    await db.proposalBlock.update({
      where: { id: blockId },
      data: { state: block.content?.trim() ? "READY" : "EMPTY" },
    });
    revalidatePath(`/propostas/${block.proposal.slug}`);
    if (error instanceof MissingAnthropicKeyError) return { error: error.message };
    return {
      error: error instanceof Error ? error.message : "Falha ao gerar o bloco",
    };
  }
}

export async function sendAgentMessageAction(
  proposalId: string,
  text: string
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const trimmed = text.trim();
  if (!trimmed) return {};

  const built = await buildContext(proposalId, organizationId);
  if (!built) return { error: "Proposta não encontrada" };

  await db.proposalMessage.create({
    data: { proposalId, author: "USER", text: trimmed },
  });
  revalidatePath(`/propostas/${built.proposal.slug}`);

  try {
    const history = await db.proposalMessage.findMany({
      where: { proposalId },
      orderBy: { createdAt: "asc" },
      take: 40,
    });

    const message = await getAnthropic().beta.messages.create({
      model: AGENT_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      thinking: { type: "adaptive" },
      system: `${SYSTEM}\n\nVocê está conversando com a equipe da Genesis sobre esta proposta. Responda de forma curta e prática.\n\nContexto:\n${built.context}`,
      messages: history.map((m) => ({
        role: m.author === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      })),
    });

    const reply =
      message.stop_reason === "refusal"
        ? "Não consigo responder a isso."
        : textFrom(message as never) || "(sem resposta)";

    await db.proposalMessage.create({
      data: { proposalId, author: "AGENT", text: reply },
    });
    revalidatePath(`/propostas/${built.proposal.slug}`);
    return {};
  } catch (error) {
    const detail =
      error instanceof MissingAnthropicKeyError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Falha ao falar com o agente";
    await db.proposalMessage.create({
      data: { proposalId, author: "AGENT", text: `⚠ ${detail}` },
    });
    revalidatePath(`/propostas/${built.proposal.slug}`);
    return { error: detail };
  }
}
