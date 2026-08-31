import type { StageType } from "@/generated/prisma/enums";

export const DEFAULT_PIPELINE_STAGES: { name: string; type: StageType }[] = [
  { name: "Lead", type: "OPEN" },
  { name: "Contato Feito", type: "OPEN" },
  { name: "Proposta Enviada", type: "OPEN" },
  { name: "Negociação", type: "OPEN" },
  { name: "Ganho", type: "WON" },
  { name: "Perdido", type: "LOST" },
];

export const DEFAULT_LOSS_REASONS: string[] = [
  "Preço",
  "Timing",
  "Concorrente",
  "Sumiu / sem resposta",
  "Não era o público certo",
  "Outro",
];
