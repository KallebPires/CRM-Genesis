import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "dono",
  ADMIN: "admin",
  MEMBER: "membro",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId, userId, role } = await requireSession();

  const [organization, user] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true },
    }),
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        userName={user.name}
        userRole={ROLE_LABELS[role ?? "MEMBER"] ?? "membro"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar organizationName={organization.name} />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
