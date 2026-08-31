import { cn } from "@/lib/utils";

/**
 * The Genesis monogram, painted with a CSS mask rather than drawn as an image.
 *
 * The art is a single-colour mark, so masking lets it take an exact brand token
 * per theme — Preto Cósmico on light, Branco Gelo on dark — from one asset.
 * (Inverting the black PNG instead would land on #FFFEF8, a warm white that
 * misses Branco Gelo's cool cast.) Pass `tone="accent"` for the blue treatment.
 */
export function BrandMark({
  className,
  size = 32,
  tone = "foreground",
}: {
  className?: string;
  size?: number;
  tone?: "foreground" | "accent";
}) {
  return (
    <span
      role="img"
      aria-label="Genesis"
      style={{
        width: size,
        height: size,
        WebkitMaskImage: "url(/logo-genesis.png)",
        maskImage: "url(/logo-genesis.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      className={cn(
        "inline-block shrink-0 select-none",
        tone === "accent" ? "bg-primary" : "bg-foreground",
        className
      )}
    />
  );
}
