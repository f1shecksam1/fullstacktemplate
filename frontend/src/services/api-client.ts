import { normalizeApiBaseUrl } from "../logger.js";
import {
  renderOperationError,
  renderOperationResult,
  renderRequestPayload,
} from "../ui/result-panel.js";
import { describeOperation } from "./operation-summary.js";

interface LoggerLike {
  log: (event: {
    level: "debug" | "info" | "warning" | "error";
    event: string;
    message?: string;
    pagePath?: string;
    details?: unknown;
  }) => Promise<void>;
}

export interface ApiRequestContext {
  fetchImpl: typeof fetch;
  logger: LoggerLike;
  pagePath: string;
  apiBaseInput: HTMLInputElement;
  resultElement: HTMLElement;
  summaryElement: HTMLElement | null;
  requestElement: HTMLElement | null;
  requestStatusElement: HTMLElement | null;
}

function renderRequestStatus(
  requestStatusElement: HTMLElement | null,
  message: string,
  tone: "running" | "success" | "error",
): void {
  if (requestStatusElement == null) {
    return;
  }

  requestStatusElement.textContent = message;
  requestStatusElement.dataset.tone = tone;
}

function apiBaseUrl(input: HTMLInputElement): string {
  return normalizeApiBaseUrl(input.value || "http://127.0.0.1:8000");
}

export async function requestJson(
  context: ApiRequestContext,
  path: string,
  init?: RequestInit,
): Promise<void> {
  const method = init?.method ?? "GET";
  let parsedBody: unknown = null;
  if (typeof init?.body === "string") {
    try {
      parsedBody = JSON.parse(init.body);
    } catch {
      parsedBody = init.body;
    }
  }

  renderRequestPayload(context.requestElement, {
    method,
    path,
    requestBody: parsedBody,
  });
  renderRequestStatus(context.requestStatusElement, `Running ${method} request...`, "running");

  await context.logger.log({
    level: "info",
    event: "api.request.started",
    pagePath: context.pagePath,
    details: { path, method },
  });

  try {
    const response = await context.fetchImpl(`${apiBaseUrl(context.apiBaseInput)}${path}`, init);
    const data: unknown = await response.json();
    const summary = describeOperation(path, method, data, response.status);

    if (!response.ok) {
      await context.logger.log({
        level: "warning",
        event: "api.request.failed",
        pagePath: context.pagePath,
        details: { path, method, statusCode: response.status, responseData: data, summary },
      });
      renderOperationError(
        context.resultElement,
        context.summaryElement,
        { error: `HTTP ${response.status}`, details: data },
        summary,
      );
      renderRequestStatus(context.requestStatusElement, `Request failed with HTTP ${response.status}.`, "error");
      return;
    }

    await context.logger.log({
      level: "info",
      event: "api.request.succeeded",
      pagePath: context.pagePath,
      details: { path, method, statusCode: response.status, summary },
    });
    renderOperationResult(context.resultElement, context.summaryElement, data, summary);
    renderRequestStatus(context.requestStatusElement, "Request completed successfully.", "success");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const summary = `Istek sirasinda hata olustu: ${method} ${path}`;
    await context.logger.log({
      level: "error",
      event: "api.request.exception",
      message,
      pagePath: context.pagePath,
      details: { path, method, summary },
    });
    renderOperationError(context.resultElement, context.summaryElement, { error: message }, summary);
    renderRequestStatus(context.requestStatusElement, "Request failed due to a runtime error.", "error");
  }
}
