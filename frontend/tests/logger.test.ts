import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFrontendLogger,
  createFrontendLogRequestBody,
  normalizeApiBaseUrl,
} from "../src/logger";

describe("logger helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes API base URLs", () => {
    expect(normalizeApiBaseUrl("http://127.0.0.1:8000/")).toBe("http://127.0.0.1:8000");
    expect(normalizeApiBaseUrl("  http://localhost:8000//  ")).toBe("http://localhost:8000");
  });

  it("creates a backend-compatible frontend log body", () => {
    const body = createFrontendLogRequestBody(
      {
        level: "warning",
        event: "ui.click",
        message: "Something happened",
        pagePath: "/dashboard",
        details: { button: "save" },
      },
      "trace-123",
      "2026-02-07T09:00:00.000Z",
      "vitest-agent",
    );

    expect(body).toEqual({
      level: "warning",
      event: "ui.click",
      message: "Something happened",
      page_path: "/dashboard",
      details: { button: "save" },
      trace_id: "trace-123",
      browser_timestamp: "2026-02-07T09:00:00.000Z",
      user_agent: "vitest-agent",
    });
  });
});

describe("createFrontendLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends structured logs to backend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    const logger = createFrontendLogger({
      getApiBaseUrl: () => "http://127.0.0.1:8000/",
      fetchImpl: fetchMock as unknown as typeof fetch,
      userAgent: "vitest-agent",
    });

    await logger.log({
      level: "info",
      event: "frontend.test",
      pagePath: "/",
      details: { sample: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8000/api/v1/logs/frontend");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        "X-Request-Id": expect.any(String),
      }),
    );

    const body = JSON.parse(init.body as string) as {
      event: string;
      level: string;
      page_path: string | null;
      trace_id: string;
    };
    expect(body.event).toBe("frontend.test");
    expect(body.level).toBe("info");
    expect(body.page_path).toBe("/");
    expect(body.trace_id).toBeTypeOf("string");
  });
});
