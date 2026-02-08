import { describe, expect, it, vi } from "vitest";

import { mountHomePage } from "../src/pages/home-page";
import { mountEchoPage } from "../src/pages/echo-page";
import { mountHealthPage } from "../src/pages/health-page";
import { mountMathPage } from "../src/pages/math-page";
import { mountTimePage } from "../src/pages/time-page";

interface LoggerStub {
  log: ReturnType<typeof vi.fn>;
}

function createLoggerStub(): LoggerStub {
  return {
    log: vi.fn().mockResolvedValue(undefined),
  };
}

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function waitForAsyncEvents(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("endpoint pages", () => {
  it("runs stop-project flow from home page", async () => {
    document.body.innerHTML = `
      <input id="api-base" value="http://api.local" />
      <button id="btn-stop-project" type="button">Stop</button>
      <pre id="request-payload"></pre>
      <p id="operation-summary"></p>
      <pre id="result"></pre>
      <nav class="nav"><a href="./pages/health.html">Health</a></nav>
    `;

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ status: "stopping", message: "accepted" }));
    const loggerStub = createLoggerStub();

    await mountHomePage({
      documentRef: document,
      fetchImpl: fetchMock as unknown as typeof fetch,
      logger: loggerStub,
      pagePath: "/index.html",
    });

    const button = document.getElementById("btn-stop-project") as HTMLButtonElement;
    button.click();
    await waitForAsyncEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/api/v1/admin/stop-project");
    expect(document.getElementById("request-payload")?.textContent).toContain(
      "/api/v1/admin/stop-project",
    );
    expect(document.getElementById("operation-summary")?.textContent).toContain(
      "Kapatma komutu gonderildi",
    );
  });

  it("runs health API flow and renders response", async () => {
    document.body.innerHTML = `
      <input id="api-base" value="http://api.local" />
      <button id="btn-run-health" type="button">Run</button>
      <pre id="request-payload"></pre>
      <p id="operation-summary"></p>
      <pre id="result"></pre>
      <nav class="nav"><a href="./index.html">Home</a></nav>
    `;

    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ status: "ok" }));
    const loggerStub = createLoggerStub();

    mountHealthPage({
      documentRef: document,
      fetchImpl: fetchMock as unknown as typeof fetch,
      logger: loggerStub,
      pagePath: "/pages/health.html",
    });

    const button = document.getElementById("btn-run-health") as HTMLButtonElement;
    button.click();
    await waitForAsyncEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/api/v1/health");
    expect(document.getElementById("request-payload")?.textContent).toContain(
      "/api/v1/health",
    );
    expect(document.getElementById("result")?.textContent).toContain("\"status\": \"ok\"");
    expect(document.getElementById("operation-summary")?.textContent).toContain(
      "Saglik kontrolu tamamlandi",
    );
    expect(loggerStub.log).toHaveBeenCalled();
  });

  it("runs echo API flow and sends JSON payload", async () => {
    document.body.innerHTML = `
      <input id="api-base" value="http://api.local" />
      <input id="echo-input" value="hello" />
      <button id="btn-run-echo" type="button">Run</button>
      <pre id="request-payload"></pre>
      <p id="operation-summary"></p>
      <pre id="result"></pre>
      <nav class="nav"><a href="./index.html">Home</a></nav>
    `;

    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ echoed: "hello", length: 5 }));
    const loggerStub = createLoggerStub();

    mountEchoPage({
      documentRef: document,
      fetchImpl: fetchMock as unknown as typeof fetch,
      logger: loggerStub,
      pagePath: "/pages/echo.html",
    });

    const button = document.getElementById("btn-run-echo") as HTMLButtonElement;
    button.click();
    await waitForAsyncEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/api/v1/echo");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{\"message\":\"hello\"}");
    expect(document.getElementById("request-payload")?.textContent).toContain("hello");
    expect(document.getElementById("operation-summary")?.textContent).toContain(
      "Echo islemi tamamlandi",
    );
  });

  it("runs time API flow and renders UTC field", async () => {
    document.body.innerHTML = `
      <input id="api-base" value="http://api.local" />
      <button id="btn-run-time" type="button">Run</button>
      <pre id="request-payload"></pre>
      <p id="operation-summary"></p>
      <pre id="result"></pre>
      <nav class="nav"><a href="./index.html">Home</a></nav>
    `;

    const fetchMock = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ utc: "2026-02-07T12:34:56+00:00" }));
    const loggerStub = createLoggerStub();

    mountTimePage({
      documentRef: document,
      fetchImpl: fetchMock as unknown as typeof fetch,
      logger: loggerStub,
      pagePath: "/pages/time.html",
    });

    const button = document.getElementById("btn-run-time") as HTMLButtonElement;
    button.click();
    await waitForAsyncEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/api/v1/time");
    expect(document.getElementById("request-payload")?.textContent).toContain(
      "/api/v1/time",
    );
    expect(document.getElementById("result")?.textContent).toContain("utc");
    expect(document.getElementById("operation-summary")?.textContent).toContain(
      "Sunucu zamani alindi",
    );
  });

  it("runs math API flow and sends query params", async () => {
    document.body.innerHTML = `
      <input id="api-base" value="http://api.local" />
      <input id="add-a" value="2" />
      <input id="add-b" value="4.5" />
      <button id="btn-run-add" type="button">Run</button>
      <pre id="request-payload"></pre>
      <p id="operation-summary"></p>
      <pre id="result"></pre>
      <nav class="nav"><a href="./index.html">Home</a></nav>
    `;

    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ a: 2, b: 4.5, result: 6.5 }));
    const loggerStub = createLoggerStub();

    mountMathPage({
      documentRef: document,
      fetchImpl: fetchMock as unknown as typeof fetch,
      logger: loggerStub,
      pagePath: "/pages/math.html",
    });

    const button = document.getElementById("btn-run-add") as HTMLButtonElement;
    button.click();
    await waitForAsyncEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.local/api/v1/math/add?a=2&b=4.5");
    expect(document.getElementById("request-payload")?.textContent).toContain("2");
    expect(document.getElementById("request-payload")?.textContent).toContain("4.5");
    expect(document.getElementById("result")?.textContent).toContain("\"result\": 6.5");
    expect(document.getElementById("operation-summary")?.textContent).toContain(
      "Toplama islemi: 2 + 4.5 = 6.5",
    );
  });
});
