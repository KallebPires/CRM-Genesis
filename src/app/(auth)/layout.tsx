import { BrandMark } from "@/components/brand-mark";
import { GlobeLazy } from "@/components/globe-lazy";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      {/* Globo de fundo: recuado e centralizado, ainda arrastável fora do card.
          Sem véu escurecendo o miolo — a elipse do degradê deixava uma borda
          visível atravessando a tela. O card é opaco e já se separa sozinho. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <GlobeLazy
          decorative
          className="pointer-events-auto h-auto w-[min(92vh,880px)] max-w-none text-foreground opacity-30"
        />
      </div>

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
