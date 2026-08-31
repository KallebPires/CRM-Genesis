import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Faint blue bloom behind the card — the one decorative flourish. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/12%,transparent_70%)]"
      />
      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <BrandMark size={56} />
          <div className="space-y-1.5 text-center">
            <p className="font-heading text-lg font-semibold tracking-tight">
              CRM Genesis
            </p>
            <p className="eyebrow">Pipeline · Conversão · Projetos</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
