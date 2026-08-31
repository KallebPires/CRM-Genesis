"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const activitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "TASK"]),
  body: z.string().min(1, "Escreva algo"),
  dueAt: z.string().optional().or(z.literal("")),
});

export type ActivityState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof activitySchema>, string>>;
};

export async function createActivityAction(
  dealId: string,
  _prev: ActivityState,
  formData: FormData
): Promise<ActivityState> {
  const { organizationId, userId } = await requireSession();

  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    body: formData.get("body"),
    dueAt: formData.get("dueAt") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: ActivityState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof z.infer<typeof activitySchema>] = issue.message;
    }
    return { fieldErrors };
  }

  const deal = await db.deal.findFirst({ where: { id: dealId, organizationId } });
  if (!deal) return { error: "Negócio não encontrado" };

  await db.activity.create({
    data: {
      organizationId,
      dealId,
      type: parsed.data.type,
      body: parsed.data.body,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      createdByUserId: userId,
    },
  });

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function toggleActivityCompleteAction(activityId: string, dealId: string) {
  const { organizationId } = await requireSession();
  const activity = await db.activity.findFirst({ where: { id: activityId, organizationId } });
  if (!activity) return;

  await db.activity.update({
    where: { id: activityId },
    data: { completedAt: activity.completedAt ? null : new Date() },
  });

  revalidatePath(`/deals/${dealId}`);
}

export async function deleteActivityAction(activityId: string, dealId: string) {
  const { organizationId } = await requireSession();
  await db.activity.deleteMany({ where: { id: activityId, organizationId } });
  revalidatePath(`/deals/${dealId}`);
}
