/**
 * Sem isto, clicar na sidebar deixa a tela anterior congelada até o servidor
 * terminar as consultas. Com o esqueleto, a navegação responde na hora e o
 * conteúdo entra por streaming quando fica pronto.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>

      <div className="space-y-2">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted opacity-60" />
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2.5 bg-card px-5 py-5">
            <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted opacity-60" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card px-[18px] py-4">
            <div className="mb-4 h-3.5 w-40 animate-pulse rounded bg-muted" />
            <div className="flex h-[190px] items-end gap-2.5">
              {[58, 82, 46, 94, 68, 38].map((h, j) => (
                <div
                  key={j}
                  className="flex-1 animate-pulse rounded-t bg-muted"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
