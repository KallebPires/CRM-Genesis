import { cn } from "@/lib/utils";

/** Anel de proporção única, desenhado com conic-gradient — sem biblioteca. */
export function Donut({
  value,
  label,
  size = 104,
}: {
  /** 0–100 */
  value: number;
  label: string;
  size?: number;
}) {
  const hole = size - 24;
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--color-primary) 0 ${value}%, var(--color-inset) ${value}% 100%)`,
      }}
    >
      <div
        className="flex flex-col items-center justify-center gap-px rounded-full bg-card"
        style={{ width: hole, height: hole }}
      >
        <span className="font-heading text-[1.375rem] font-semibold leading-none tracking-tight tabular">
          {value}%
        </span>
        <span className="eyebrow">{label}</span>
      </div>
    </div>
  );
}

export function DonutRows({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>;
}

export function DonutRow({
  label,
  value,
  meta,
  dot,
  divider = true,
}: {
  label: string;
  value: string | number;
  meta: string;
  dot?: "success" | "danger";
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3",
        divider && "border-b pb-3"
      )}
    >
      <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        {dot ? (
          <span
            className={cn(
              "size-1.5 rounded-full",
              dot === "success" ? "bg-success" : "bg-danger"
            )}
          />
        ) : null}
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-[1.0625rem] font-semibold leading-none tabular">
          {value}
        </span>
        <span className="text-[11.5px] text-muted-foreground tabular">{meta}</span>
      </div>
    </div>
  );
}
