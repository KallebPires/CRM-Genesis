"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

// --- Pipeline stages ---------------------------------------------------

const stageSchema = z.object({
  name: z.string().min(1, "Informe o nome da etapa"),
  type: z.enum(["OPEN", "WON", "LOST"]),
});

export type StageState = { error?: string };

export async function createStageAction(_prev: StageState, formData: FormData): Promise<StageState> {
  const { organizationId } = await requireSession();
  const parsed = stageSchema.safeParse({ name: formData.get("name"), type: formData.get("type") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const last = await db.pipelineStage.findFirst({
    where: { organizationId },
    orderBy: { order: "desc" },
  });

  await db.pipelineStage.create({
    data: {
      organizationId,
      name: parsed.data.name,
      type: parsed.data.type,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/deals");
  return {};
}

export async function deleteStageAction(stageId: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();

  const stageCount = await db.pipelineStage.count({ where: { organizationId } });
  if (stageCount <= 1) {
    return { error: "O pipeline precisa ter ao menos uma etapa" };
  }

  const dealsInStage = await db.deal.count({ where: { stageId, organizationId } });
  if (dealsInStage > 0) {
    return { error: "Mova os negócios desta etapa antes de excluí-la" };
  }

  await db.pipelineStage.deleteMany({ where: { id: stageId, organizationId } });
  revalidatePath("/settings");
  revalidatePath("/deals");
  return {};
}

export async function moveStageAction(stageId: string, direction: "up" | "down") {
  const { organizationId } = await requireSession();
  const stages = await db.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { order: "asc" },
  });

  const index = stages.findIndex((s) => s.id === stageId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= stages.length) return;

  const a = stages[index];
  const b = stages[swapWith];

  await db.$transaction([
    db.pipelineStage.update({ where: { id: a.id }, data: { order: -1 } }),
    db.pipelineStage.update({ where: { id: b.id }, data: { order: a.order } }),
    db.pipelineStage.update({ where: { id: a.id }, data: { order: b.order } }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/deals");
}

// --- Loss reasons --------------------------------------------------------

const lossReasonSchema = z.object({ label: z.string().min(1, "Informe o motivo") });

export type LossReasonState = { error?: string };

export async function createLossReasonAction(
  _prev: LossReasonState,
  formData: FormData
): Promise<LossReasonState> {
  const { organizationId } = await requireSession();
  const parsed = lossReasonSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await db.lossReason.create({ data: { organizationId, label: parsed.data.label } });
  revalidatePath("/settings");
  return {};
}

export async function deleteLossReasonAction(lossReasonId: string) {
  const { organizationId } = await requireSession();
  await db.lossReason.deleteMany({ where: { id: lossReasonId, organizationId } });
  revalidatePath("/settings");
}

// --- Team members ----------------------------------------------------------

const memberSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type MemberState = { error?: string };

export async function addMemberAction(_prev: MemberState, formData: FormData): Promise<MemberState> {
  const { organizationId } = await requireSession();
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    const alreadyMember = await db.organizationMembership.findFirst({
      where: { userId: existing.id, organizationId },
    });
    if (alreadyMember) return { error: "Este usuário já faz parte da equipe" };

    await db.organizationMembership.create({
      data: { userId: existing.id, organizationId, role: parsed.data.role },
    });
  } else {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        memberships: { create: { organizationId, role: parsed.data.role } },
      },
    });
  }

  revalidatePath("/settings");
  return {};
}

export async function removeMemberAction(membershipId: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  const membership = await db.organizationMembership.findFirst({
    where: { id: membershipId, organizationId },
  });
  if (membership?.role === "OWNER") {
    return { error: "Não é possível remover o dono da conta" };
  }
  await db.organizationMembership.deleteMany({ where: { id: membershipId, organizationId } });
  revalidatePath("/settings");
  return {};
}
