"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const companySchema = z.object({
  name: z.string().min(1, "Informe o nome da empresa"),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CompanyState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof companySchema>, string>>;
};

function parseCompanyForm(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

function fieldErrorsFrom(error: z.ZodError<z.infer<typeof companySchema>>) {
  const fieldErrors: CompanyState["fieldErrors"] = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path[0] as keyof z.infer<typeof companySchema>] = issue.message;
  }
  return fieldErrors;
}

export async function createCompanyAction(
  _prev: CompanyState,
  formData: FormData
): Promise<CompanyState> {
  const { organizationId } = await requireSession();
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.company.create({
    data: {
      organizationId,
      name: parsed.data.name,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/companies");
  return {};
}

export async function updateCompanyAction(
  companyId: string,
  _prev: CompanyState,
  formData: FormData
): Promise<CompanyState> {
  const { organizationId } = await requireSession();
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.company.updateMany({
    where: { id: companyId, organizationId },
    data: {
      name: parsed.data.name,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/companies");
  return {};
}

export async function deleteCompanyAction(companyId: string) {
  const { organizationId } = await requireSession();
  await db.company.deleteMany({ where: { id: companyId, organizationId } });
  revalidatePath("/companies");
}
