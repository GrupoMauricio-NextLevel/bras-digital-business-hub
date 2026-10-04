/**
 * Tempo máximo das chamadas a sistemas externos (Mercado Pago, plataformas de frete, e-mail).
 * Documentos 09 §103 e 10 §121: nenhuma chamada externa pode travar a requisição para sempre.
 * O limite padrão é de 10 s; `EXTERNAL_TIMEOUT_MS` ajusta (os testes usam um valor curto).
 */
export const externalTimeoutMs = () => Number(process.env.EXTERNAL_TIMEOUT_MS) || 10_000;
export const timeoutSignal = (): AbortSignal => AbortSignal.timeout(externalTimeoutMs());
export const isTimeoutError = (e: unknown): boolean => e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");

/** Espera entre tentativas de leitura (ms); `EXTERNAL_RETRY_DELAY_MS=0` nos testes. */
export const retryDelayMs = (attempt: number) => (process.env.EXTERNAL_RETRY_DELAY_MS !== undefined ? Number(process.env.EXTERNAL_RETRY_DELAY_MS) : 250) * attempt;
/** Vale repetir? Só falha temporária: sem resposta, 429 ou 5xx. Nunca repita cobrança (POST). */
export const isRetryableStatus = (status: number) => status === 429 || status >= 500;
export const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());
