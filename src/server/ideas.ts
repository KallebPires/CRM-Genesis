"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const ideaSchema = z.object({
  title: z.string().min(1, "Dê um nome à ideia"),
  description: z.string().optional().or(z.literal("")),
  referenceName: z.string().optional().or(z.literal("")),
  referenceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  category: z.enum(["SITE", "SAAS", "ERP", "AUTOMACAO", "IA", "OUTRO"]),
  status: z.enum([
    "BACKLOG",
    "RESEARCHING",
    "VALIDATING",
    "BUILDING",
    "LAUNCHED",
    "DISCARDED",
  ]),
  potential: z.coerce.number().int().min(1).max(5),
  effort: z.enum(["LOW", "MEDIUM", "HIGH"]),
  targetAudience: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type IdeaState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof ideaSchema>, string>>;
};

function parseIdeaForm(formData: FormData) {
  return ideaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    referenceName: formData.get("referenceName") ?? "",
    referenceUrl: formData.get("referenceUrl") ?? "",
    category: formData.get("category"),
    status: formData.get("status"),
    potential: formData.get("potential") || 3,
    effort: formData.get("effort"),
    targetAudience: formData.get("targetAudience") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

function fieldErrorsFrom(error: z.ZodError<z.infer<typeof ideaSchema>>) {
  const fieldErrors: IdeaState["fieldErrors"] = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path[0] as keyof z.infer<typeof ideaSchema>] = issue.message;
  }
  return fieldErrors;
}

function toData(parsed: z.infer<typeof ideaSchema>) {
  return {
    title: parsed.title,
    description: parsed.description || null,
    referenceName: parsed.referenceName || null,
    referenceUrl: parsed.referenceUrl || null,
    category: parsed.category,
    status: parsed.status,
    potential: parsed.potential,
    effort: parsed.effort,
    targetAudience: parsed.targetAudience || null,
    notes: parsed.notes || null,
  };
}

export async function createIdeaAction(
  _prev: IdeaState,
  formData: FormData
): Promise<IdeaState> {
  const { organizationId, userId } = await requireSession();
  const parsed = parseIdeaForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.idea.create({
    data: { organizationId, createdByUserId: userId, ...toData(parsed.data) },
  });

  revalidatePath("/ideas");
  return {};
}

export async function updateIdeaAction(
  ideaId: string,
  _prev: IdeaState,
  formData: FormData
): Promise<IdeaState> {
  const { organizationId } = await requireSession();
  const parsed = parseIdeaForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.idea.updateMany({
    where: { id: ideaId, organizationId },
    data: toData(parsed.data),
  });

  revalidatePath("/ideas");
  return {};
}

/** Status-only change, so the cards can advance without opening the dialog. */
export async function setIdeaStatusAction(
  ideaId: string,
  status: z.infer<typeof ideaSchema>["status"]
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await db.idea.updateMany({ where: { id: ideaId, organizationId }, data: { status } });
  revalidatePath("/ideas");
  return {};
}

export async function deleteIdeaAction(ideaId: string): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();
  await db.idea.deleteMany({ where: { id: ideaId, organizationId } });
  revalidatePath("/ideas");
  return {};
}
