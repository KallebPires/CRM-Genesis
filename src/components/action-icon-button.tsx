"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Runs a server action that reports failure by returning `{ error }` rather
 * than throwing — thrown messages get masked in production builds, so the
 * useful guidance would never reach the user.
 */
export function ActionIconButton({
  action,
  children,
  confirmMessage,
  className,
  disabled,
  label,
}: {
  action: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
  confirmMessage?: string;
  className?: string;
  disabled?: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled || pending}
      onClick={handleClick}
      className={cn(className)}
    >
      {children}
    </Button>
  );
}
