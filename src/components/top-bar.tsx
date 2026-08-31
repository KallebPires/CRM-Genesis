"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar({ organizationName }: { organizationName: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <span className="text-sm font-medium text-muted-foreground">{organizationName}</span>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sair
        </Button>
      </div>
    </header>
  );
}
