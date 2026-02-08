export type FrontendLogLevel = "debug" | "info" | "warning" | "error";

export interface FrontendLogEvent {
  level: FrontendLogLevel;
  event: string;
  message?: string;
  pagePath?: string;
  details?: unknown;
}

export interface FrontendLogRequestBody {
  level: FrontendLogLevel;
  event: string;
  message: string | null;
  page_path: string | null;
  details: Record<string, unknown> | null;
  trace_id: string;
  browser_timestamp: string;
  user_agent: string | null;
}

interface FrontendLoggerOptions {
  getApiBaseUrl: () => string;
  fetchImpl?: typeof fetch;
  userAgent?: string;
}

const FRONTEND_LOG_PATH = "/api/v1/logs/frontend";

function defaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return window.fetch(input, init);
}

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.replace(/\/+$/, "");
}

export function createFrontendLogRequestBody(
  event: FrontendLogEvent,
  traceId: string,
  timestamp: string,
  userAgent: string | null,
): FrontendLogRequestBody {
  return {
    level: event.level,
    event: event.event,
    message: event.message ?? null,
    page_path: event.pagePath ?? null,
    details: normalizeDetails(event.details),
    trace_id: traceId,
    browser_timestamp: timestamp,
    user_agent: userAgent,
  };
}

function consoleMethod(level: FrontendLogLevel): "debug" | "info" | "warn" | "error" {
  if (level === "warning") {
    return "warn";
  }
  return level;
}

function normalizeDetails(details: unknown): Record<string, unknown> | null {
  if (details == null) {
    return null;
  }

  if (typeof details === "object" && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }

  return { value: details };
}

function createTraceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createFrontendLogger(options: FrontendLoggerOptions) {
  const fetchImpl = options.fetchImpl ?? defaultFetch;

  async function log(event: FrontendLogEvent): Promise<void> {
    const timestamp = new Date().toISOString();
    const userAgent = options.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : null);
    const traceId = createTraceId();

    const body = createFrontendLogRequestBody(event, traceId, timestamp, userAgent);
    const method = consoleMethod(event.level);
    console[method]({
      source: "frontend",
      ...body,
    });

    try {
      const apiBase = normalizeApiBaseUrl(options.getApiBaseUrl());
      await fetchImpl(`${apiBase}${FRONTEND_LOG_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": traceId,
        },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {
      console.warn({ source: "frontend", event: "frontend.log.delivery_failed" });
    }
  }

  return {
    log,
  };
}
