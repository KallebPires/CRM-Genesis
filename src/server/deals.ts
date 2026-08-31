"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const dealSchema = z.object({
  title: z.string().min(1, "Informe o título do negócio"),
  contactId: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
  value: z.coerce.number().min(0, "Valor inválido").default(0),
  serviceType: z.enum(["SITE", "SAAS", "ERP", "AUTOMACAO", "IA", "OUTRO"]),
  expectedCloseDate: z.string().optional().or(z.literal("")),
});

export type DealState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof dealSchema>, string>>;
};

function parseDealForm(formData: FormData) {
  return dealSchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId") ?? "",
    companyId: formData.get("companyId") ?? "",
    value: formData.get("value") || 0,
    serviceType: formData.get("serviceType"),
    expectedCloseDate: formData.get("expectedCloseDate") ?? "",
  });
}

function fieldErrorsFrom(error: z.ZodError<z.infer<typeof dealSchema>>) {
  const fieldErrors: DealState["fieldErrors"] = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path[0] as keyof z.infer<typeof dealSchema>] = issue.message;
  }
  return fieldErrors;
}

export async function createDealAction(
  _prev: DealState,
  formData: FormData
): Promise<DealState> {
  const { organizationId } = await requireSession();
  const parsed = parseDealForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const firstStage = await db.pipelineStage.findFirstOrThrow({
    where: { organizationId },
    orderBy: { order: "asc" },
  });

  const deal = await db.deal.create({
    data: {
      organizationId,
      title: parsed.data.title,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      value: parsed.data.value,
      serviceType: parsed.data.serviceType,
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(parsed.data.expectedCloseDate)
        : null,
      stageId: firstStage.id,
    },
  });

  await db.stageHistory.create({
    data: { dealId: deal.id, toStageId: firstStage.id },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return {};
}

export async function updateDealAction(
  dealId: string,
  _prev: DealState,
  formData: FormData
): Promise<DealState> {
  const { organizationId } = await requireSession();
  const parsed = parseDealForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.deal.updateMany({
    where: { id: dealId, organizationId },
    data: {
      title: parsed.data.title,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      value: parsed.data.value,
      serviceType: parsed.data.serviceType,
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(parsed.data.expectedCloseDate)
        : null,
    },
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function deleteDealAction(dealId: string) {
  const { organizationId } = await requireSession();
  await db.deal.deleteMany({ where: { id: dealId, organizationId } });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function moveDealStageAction(
  dealId: string,
  toStageId: string,
  lostReasonId?: string
): Promise<{ error?: string }> {
  const { organizationId } = await requireSession();

  const [deal, toStage] = await Promise.all([
    db.deal.findFirst({ where: { id: dealId, organizationId } }),
    db.pipelineStage.findFirst({ where: { id: toStageId, organizationId } }),
  ]);

  if (!deal || !toStage) return { error: "Negócio ou etapa não encontrados" };
  if (toStage.type === "LOST" && !lostReasonId) {
    return { error: "Selecione um motivo de perda" };
  }

  await db.$transaction([
    db.deal.update({
      where: { id: dealId },
      data: {
        stageId: toStageId,
        status: toStage.type,
        closedAt: toStage.type === "OPEN" ? null : new Date(),
        lostReasonId: toStage.type === "LOST" ? lostReasonId : null,
      },
    }),
    db.stageHistory.create({
      data: { dealId, fromStageId: deal.stageId, toStageId },
    }),
  ]);

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return {};
}
