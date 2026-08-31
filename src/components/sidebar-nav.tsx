"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import {
  LayoutDashboard,
  Filter,
  TrendingUp,
  KanbanSquare,
  FileText,
  Users,
  Building2,
  Lightbulb,
  Settings,
} from "lucide-react";

const groups = [
  {
    label: "Visão geral",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/funil", label: "Funil", icon: Filter },
      { href: "/receita", label: "Receita", icon: TrendingUp },
      { href: "/deals", label: "Negócios", icon: KanbanSquare },
      { href: "/propostas", label: "Propostas", icon: FileText },
    ],
  },
  {
    label: "Cadastros",
    links: [
      { href: "/contacts", label: "Contatos", icon: Users },
      { href: "/companies", label: "Empresas", icon: Building2 },
    ],
  },
  {
    label: "Produto",
    links: [{ href: "/ideas", label: "Ideias", icon: Lightbulb }],
  },
  {
    label: "Conta",
    links: [{ href: "/settings", label: "Configurações", icon: Settings }],
  },
];

export function SidebarNav({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-5">
        <BrandMark size={26} />
        <span className="font-heading text-[0.9375rem] font-semibold tracking-tight">
          Genesis
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3 pt-4">
        {groups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="eyebrow px-2.5 pb-1.5">{group.label}</p>
            {group.links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-accent font-medium text-foreground shadow-[inset_2px_0_0_var(--color-primary)]"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active && "text-primary")}
                  />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t px-[18px] py-3.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-xs font-semibold text-accent-foreground">
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">{userName}</span>
          <span className="eyebrow">{userRole}</span>
        </span>
      </div>
    </aside>
  );
}
