export function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  SITE: "Site",
  SAAS: "SaaS",
  ERP: "ERP",
  AUTOMACAO: "Automação",
  IA: "IA",
  OUTRO: "Outro",
};

export const IDEA_STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Ideia",
  RESEARCHING: "Pesquisando",
  VALIDATING: "Validando",
  BUILDING: "Construindo",
  LAUNCHED: "Lançado",
  DISCARDED: "Descartado",
};

/** Display order for the status filter — the natural life cycle of an idea. */
export const IDEA_STATUS_ORDER = [
  "BACKLOG",
  "RESEARCHING",
  "VALIDATING",
  "BUILDING",
  "LAUNCHED",
  "DISCARDED",
] as const;

export const EFFORT_LABELS: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
};

/**
 * Ranks the backlog by payoff per unit of work, so a high-potential/low-effort
 * idea floats above an equally promising one that would take months.
 */
export const EFFORT_WEIGHT: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

export function ideaScore(potential: number, effort: string) {
  return potential / (EFFORT_WEIGHT[effort] ?? 2);
}
