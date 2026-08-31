"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import {
  LayoutDashboard,
  KanbanSquare,
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
      { href: "/deals", label: "Negócios", icon: KanbanSquare },
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <BrandMark size={26} />
        <span className="font-heading text-[0.9375rem] font-semibold tracking-tight">
          Genesis
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="eyebrow px-3 pb-1">{group.label}</p>
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
                    "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {/* Blue reads as a marker, not a slab of fill. */}
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  ) : null}
                  <Icon
                    className={cn("h-4 w-4", active ? "text-primary" : "text-current")}
                  />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
