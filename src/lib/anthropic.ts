import Anthropic from "@anthropic-ai/sdk";

/** Erro esperado quando o ambiente não tem credencial — vira mensagem na UI. */
export class MissingAnthropicKeyError extends Error {
  constructor() {
    super(
      "Defina ANTHROPIC_API_KEY no .env para usar o agente de IA. " +
        "Pegue uma chave em console.anthropic.com."
    );
    this.name = "MissingAnthropicKeyError";
  }
}

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingAnthropicKeyError();
  client ??= new Anthropic();
  return client;
}

export const AGENT_MODEL = "claude-opus-5";

/**
 * Extrai o texto de uma resposta. `content` é uma união discriminada — blocos
 * de raciocínio e de fallback entram junto e precisam ser filtrados.
 */
export function textFrom(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
