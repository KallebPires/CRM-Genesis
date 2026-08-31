import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho interno de card: título à esquerda, meta ou ação à direita.
 * `dot` marca a seção com um ponto semântico (atenção, sucesso, perigo).
 */
export function SectionHeader({
  title,
  meta,
  action,
  dot,
  className,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
  dot?: "success" | "warning" | "danger" | "accent";
  className?: string;
}) {
  const dotClass = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    accent: "bg-primary",
  };

  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-3", className)}>
      <span className="flex items-center gap-2 font-heading text-[13px] font-semibold tracking-tight">
        {dot ? <span className={cn("size-1.5 rounded-full", dotClass[dot])} /> : null}
        {title}
      </span>
      {action ?? (meta ? <span className="text-[11px] text-muted-foreground tabular">{meta}</span> : null)}
    </div>
  );
}

/** Link discreto "Ver X →" no canto do card. */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[11.5px] font-medium text-link transition-opacity hover:opacity-80"
    >
      {children} →
    </Link>
  );
}
