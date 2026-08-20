import "server-only";

export type GeminiErrorInfo = {
  status?: number;
  code?: string;
  providerMessage: string;
  retryable: boolean;
  dailyQuota: boolean;
  retryAfterMs?: number;
  userMessage: string;
};

export type GeminiAttemptTrace = {
  attempt: number;
  model: string;
  operation: string;
  pacedMs: number;
  backoffMs: number;
  elapsedMs: number;
  status: "done" | "retry" | "error";
  httpStatus?: number;
  code?: string;
  message?: string;
};

export class GeminiRequestError extends Error {
  constructor(
    readonly info: GeminiErrorInfo,
    readonly attempts: GeminiAttemptTrace[],
  ) {
    super(info.providerMessage || info.userMessage);
    this.name = "GeminiRequestError";
  }
}

type PacerState = {
  nextGlobalAt: number;
  nextByLane: Record<string, number>;
};

type GlobalWithGeminiPacer = typeof globalThis & {
  __abdulrahmanGeminiPacerV10?: PacerState;
};

function envInt(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : fallback;
}

function pacerState() {
  const root = globalThis as GlobalWithGeminiPacer;
  root.__abdulrahmanGeminiPacerV10 ??= { nextGlobalAt: 0, nextByLane: {} };
  return root.__abdulrahmanGeminiPacerV10;
}

function laneForModel(model: string) {
  return /flash-lite/i.test(model) ? "flash-lite" : /flash/i.test(model) ? "flash" : model.toLowerCase();
}

function modelIntervalMs(model: string) {
  const lane = laneForModel(model);
  if (lane === "flash-lite") return envInt("GEMINI_FLASH_LITE_MIN_INTERVAL_MS", 4500, 1000, 60_000);
  if (lane === "flash") return envInt("GEMINI_FLASH_MIN_INTERVAL_MS", 7000, 1000, 60_000);
  return envInt("GEMINI_OTHER_MODEL_MIN_INTERVAL_MS", 12_000, 1000, 60_000);
}

function sleep(ms: number, signal: AbortSignal) {
  if (ms <= 0) return Promise.resolve();
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function waitForPacer(model: string, signal: AbortSignal) {
  const state = pacerState();
  const lane = laneForModel(model);
  const now = Date.now();
  const globalInterval = envInt("GEMINI_GLOBAL_MIN_INTERVAL_MS", 2000, 0, 60_000);
  const laneInterval = modelIntervalMs(model);

  // Reserve the slot synchronously before awaiting. That makes concurrent requests handled by
  // the same warm Vercel instance queue instead of racing into Gemini at the same moment.
  const reservedAt = Math.max(now, state.nextGlobalAt, state.nextByLane[lane] ?? 0);
  state.nextGlobalAt = reservedAt + globalInterval;
  state.nextByLane[lane] = reservedAt + laneInterval;
  const waitMs = Math.max(0, reservedAt - now);
  await sleep(waitMs, signal);
  return waitMs;
}

function redactedMessage(value: unknown) {
  const pieces: string[] = [];
  if (value instanceof Error && value.message) pieces.push(value.message);
  else if (typeof value === "string") pieces.push(value);

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    const diagnostic = {
      status: object.status,
      code: object.code,
      details: object.details,
      error: object.error,
    };
    try {
      const structured = JSON.stringify(diagnostic);
      if (structured && structured !== "{}") pieces.push(structured);
    } catch {
      // Keep the human-readable Error.message when structured fields are circular.
    }
  }

  if (!pieces.length) {
    try { pieces.push(JSON.stringify(value)); } catch { pieces.push(String(value)); }
  }
  return pieces.join(" | ")
    .replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_API_KEY]")
    .slice(0, 1800);
}

function nestedNumber(value: unknown, keys: string[]) {
  let cursor: unknown = value;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "number" && Number.isFinite(cursor) ? cursor : undefined;
}

function nestedString(value: unknown, keys: string[]) {
  let cursor: unknown = value;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

export function diagnoseGeminiError(error: unknown): GeminiErrorInfo {
  const providerMessage = redactedMessage(error);
  const object = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status =
    (typeof object.status === "number" ? object.status : undefined) ??
    (typeof object.code === "number" ? object.code : undefined) ??
    nestedNumber(error, ["response", "status"]) ??
    (() => {
      const match = providerMessage.match(/(?:HTTP\s*)?\b(400|401|403|404|408|409|429|500|502|503|504)\b/i);
      return match ? Number(match[1]) : undefined;
    })();

  const code =
    (typeof object.code === "string" ? object.code : undefined) ??
    (typeof object.status === "string" ? object.status : undefined) ??
    nestedString(error, ["error", "status"]) ??
    providerMessage.match(/\b(RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|INVALID_ARGUMENT|PERMISSION_DENIED|NOT_FOUND|CANCELLED)\b/i)?.[1]?.toUpperCase();

  const retryDelayMatch = providerMessage.match(/(?:retryDelay|retry[_ -]?after)["'\s:=]*([0-9]+(?:\.[0-9]+)?)\s*s/i);
  const retryAfterMs = retryDelayMatch ? Math.ceil(Number(retryDelayMatch[1]) * 1000) : undefined;
  const dailyQuota = status === 429 && /quota_exceeded|requests? per day|per-day|\brpd\b|daily quota|quota.*day/i.test(providerMessage);
  const retryable = !dailyQuota && (
    status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|temporar|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(`${code ?? ""} ${providerMessage}`)
  );

  let userMessage = "تعذر الاتصال بـ Gemini.";
  if (status === 429 && dailyQuota) userMessage = "تم بلوغ الحصة اليومية لموديل Gemini المستخدم. الانتظار لثوانٍ لن يحل هذا النوع من الحد؛ يلزم انتظار إعادة تعيين الحصة أو تغيير الموديل ضمن حصتك.";
  else if (status === 429 || /RESOURCE_EXHAUSTED/i.test(`${code ?? ""} ${providerMessage}`)) userMessage = "Gemini رفض الطلب مؤقتاً بسبب حد المعدل أو التوكنز. الوكيل سيبطئ الطلبات ويعيد المحاولة تلقائياً.";
  else if (status === 503 || /UNAVAILABLE/i.test(`${code ?? ""} ${providerMessage}`)) userMessage = "خدمة Gemini غير متاحة مؤقتاً. الوكيل سيعيد المحاولة تلقائياً بتراجع أُسّي.";
  else if (status === 400 || /INVALID_ARGUMENT/i.test(`${code ?? ""} ${providerMessage}`)) userMessage = "Gemini رفض تكوين الطلب نفسه (INVALID_ARGUMENT). هذه ليست مشكلة كوتا؛ راجع تفاصيل الخطأ في تتبّع الوكيل.";
  else if (status === 401 || status === 403 || /PERMISSION_DENIED/i.test(`${code ?? ""} ${providerMessage}`)) userMessage = "Gemini رفض صلاحية الطلب أو المفتاح. هذه ليست مشكلة ازدحام طلبات.";
  else if (status === 404 || /NOT_FOUND/i.test(`${code ?? ""} ${providerMessage}`)) userMessage = "موديل Gemini أو مورد مرتبط بالطلب غير موجود أو غير متاح للمشروع.";

  return { status, code, providerMessage, retryable, dailyQuota, retryAfterMs, userMessage };
}

function retryDelay(attempt: number, info: GeminiErrorInfo) {
  const base = envInt("GEMINI_RETRY_BASE_MS", 2500, 500, 30_000);
  const max = envInt("GEMINI_RETRY_MAX_MS", 30_000, 1000, 90_000);
  const exponential = Math.min(max, base * (2 ** Math.max(0, attempt - 1)));
  const jitter = Math.floor(Math.random() * Math.min(1200, Math.max(250, Math.round(exponential * 0.2))));
  return Math.max(info.retryAfterMs ?? 0, exponential + jitter);
}

export async function runGeminiRequest<T>(args: {
  model: string;
  operation: string;
  signal: AbortSignal;
  maxAttempts?: number;
  call: () => Promise<T>;
}): Promise<{ value: T; attempts: GeminiAttemptTrace[] }> {
  const maxAttempts = args.maxAttempts ?? (/flash-lite/i.test(args.model) ? 3 : 4);
  const attempts: GeminiAttemptTrace[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const pacedMs = await waitForPacer(args.model, args.signal);
    const started = Date.now();
    try {
      const value = await args.call();
      attempts.push({ attempt, model: args.model, operation: args.operation, pacedMs, backoffMs: 0, elapsedMs: Date.now() - started, status: "done" });
      return { value, attempts };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      const info = diagnoseGeminiError(error);
      const canRetry = info.retryable && attempt < maxAttempts;
      const backoffMs = canRetry ? retryDelay(attempt, info) : 0;
      attempts.push({
        attempt,
        model: args.model,
        operation: args.operation,
        pacedMs,
        backoffMs,
        elapsedMs: Date.now() - started,
        status: canRetry ? "retry" : "error",
        httpStatus: info.status,
        code: info.code,
        message: info.providerMessage,
      });
      if (!canRetry) throw new GeminiRequestError(info, attempts);
      await sleep(backoffMs, args.signal);
    }
  }

  throw new GeminiRequestError(
    { providerMessage: "Gemini retry loop exhausted", retryable: false, dailyQuota: false, userMessage: "استنفدت محاولات Gemini." },
    attempts,
  );
}
