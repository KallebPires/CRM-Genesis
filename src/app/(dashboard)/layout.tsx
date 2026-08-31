import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId } = await requireSession();

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <TopBar organizationName={organization.name} />
        <main className="flex-1 bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
