"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const contactSchema = z.object({
  name: z.string().min(1, "Informe o nome do contato"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
});

export type ContactState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof contactSchema>, string>>;
};

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    role: formData.get("role") ?? "",
    source: formData.get("source") ?? "",
    companyId: formData.get("companyId") ?? "",
  });
}

function fieldErrorsFrom(error: z.ZodError<z.infer<typeof contactSchema>>) {
  const fieldErrors: ContactState["fieldErrors"] = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path[0] as keyof z.infer<typeof contactSchema>] = issue.message;
  }
  return fieldErrors;
}

export async function createContactAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const { organizationId } = await requireSession();
  const parsed = parseContactForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.contact.create({
    data: {
      organizationId,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      role: parsed.data.role || null,
      source: parsed.data.source || null,
      companyId: parsed.data.companyId || null,
    },
  });

  revalidatePath("/contacts");
  return {};
}

export async function updateContactAction(
  contactId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const { organizationId } = await requireSession();
  const parsed = parseContactForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.contact.updateMany({
    where: { id: contactId, organizationId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      role: parsed.data.role || null,
      source: parsed.data.source || null,
      companyId: parsed.data.companyId || null,
    },
  });

  revalidatePath("/contacts");
  return {};
}

export async function deleteContactAction(contactId: string) {
  const { organizationId } = await requireSession();
  await db.contact.deleteMany({ where: { id: contactId, organizationId } });
  revalidatePath("/contacts");
}
