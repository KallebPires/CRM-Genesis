/** Estrutura padrão de uma proposta da Genesis, na ordem em que é lida. */
export const DEFAULT_BLOCKS: { label: string; brief: string }[] = [
  {
    label: "Contexto",
    brief:
      "Resuma a situação do cliente e o problema que motivou a conversa, em 1 parágrafo curto.",
  },
  {
    label: "Objetivo",
    brief: "Diga o que a solução precisa alcançar, em 2 a 4 marcadores objetivos.",
  },
  {
    label: "Escopo",
    brief:
      "Liste o que está incluído, em marcadores concretos e verificáveis. Seja específico sobre entregáveis.",
  },
  {
    label: "Fora do escopo",
    brief:
      "Liste explicitamente o que NÃO está incluído, para evitar expectativa equivocada.",
  },
  {
    label: "Cronograma",
    brief:
      "Proponha fases com duração estimada. Use faixas honestas, não promessas exatas.",
  },
  {
    label: "Investimento",
    brief:
      "Apresente o valor e a forma de pagamento sugerida. Justifique brevemente o que sustenta o preço.",
  },
  {
    label: "Próximos passos",
    brief: "Diga exatamente o que o cliente precisa fazer para seguir, em 2 a 3 itens.",
  },
];

export const AGENT_ACTIONS = [
  "Gerar do negócio",
  "Sugerir preço e escopo",
  "Resumir histórico",
  "Revisar antes de enviar",
] as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  GENERATING: "Gerando",
  AWAITING: "Aguardando aprovação",
  SENT: "Enviada",
  VIEWED: "Vista pelo cliente",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
};

export const PROPOSAL_STATUS_ORDER = [
  "DRAFT",
  "GENERATING",
  "AWAITING",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
] as const;
