import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.organizationId) {
    redirect("/login");
  }
  return {
    userId: session.user.id,
    organizationId: session.organizationId,
    role: session.organizationRole,
  };
}
