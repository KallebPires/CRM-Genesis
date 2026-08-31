"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createOrganizationWithOwner } from "@/server/organizations";

const signupSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  organizationName: z.string().min(2, "Informe o nome da empresa"),
});

export type SignupState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof signupSchema>, string>>;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    const fieldErrors: SignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof signupSchema>;
      fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password, organizationName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Já existe uma conta com este e-mail" } };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  await createOrganizationWithOwner({ organizationName, userId: user.id });

  return {};
}
