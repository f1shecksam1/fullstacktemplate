import { createFrontendLogger, normalizeApiBaseUrl } from "../logger.js";
import { requestJson as runApiRequest } from "../services/api-client.js";

export const API_VERSION_PREFIX = "/api/v1";

export interface FrontendLoggerLike {
  log: (event: {
    level: "debug" | "info" | "warning" | "error";
    event: string;
    message?: string;
    pagePath?: string;
    details?: unknown;
  }) => Promise<void>;
}

export interface PageSetupOptions {
  documentRef?: Document;
  fetchImpl?: typeof fetch;
  logger?: FrontendLoggerLike;
  userAgent?: string;
  pagePath?: string;
}

export interface PageContext {
  documentRef: Document;
  fetchImpl: typeof fetch;
  logger: FrontendLoggerLike;
  pagePath: string;
  apiBaseInput: HTMLInputElement;
  resultElement: HTMLElement;
  summaryElement: HTMLElement | null;
  requestElement: HTMLElement | null;
  requestStatusElement: HTMLElement | null;
}

function defaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return window.fetch(input, init);
}

function resolvePagePath(pagePath: string | undefined): string {
  if (pagePath != null) {
    return pagePath;
  }

  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
}

function resolveApiBaseInput(documentRef: Document): HTMLInputElement | null {
  return documentRef.getElementById("api-base") as HTMLInputElement | null;
}

function resolveResultElement(documentRef: Document): HTMLElement | null {
  return documentRef.getElementById("result");
}

function resolveSummaryElement(documentRef: Document): HTMLElement | null {
  return documentRef.getElementById("operation-summary");
}

function resolveRequestElement(documentRef: Document): HTMLElement | null {
  return documentRef.getElementById("request-payload");
}

function resolveRequestStatusElement(documentRef: Document): HTMLElement | null {
  return documentRef.getElementById("request-status");
}

function apiBaseUrl(input: HTMLInputElement): string {
  return normalizeApiBaseUrl(input.value || "http://127.0.0.1:8000");
}

export function createPageContext(options: PageSetupOptions = {}): PageContext | null {
  const documentRef = options.documentRef ?? document;
  const apiBaseInput = resolveApiBaseInput(documentRef);
  const resultElement = resolveResultElement(documentRef);
  const summaryElement = resolveSummaryElement(documentRef);
  const requestElement = resolveRequestElement(documentRef);
  const requestStatusElement = resolveRequestStatusElement(documentRef);
  if (apiBaseInput == null || resultElement == null) {
    return null;
  }

  const logger =
    options.logger ??
    createFrontendLogger({
      getApiBaseUrl: () => apiBaseUrl(apiBaseInput),
      fetchImpl: options.fetchImpl,
      userAgent: options.userAgent,
    });

  return {
    documentRef,
    fetchImpl: options.fetchImpl ?? defaultFetch,
    logger,
    pagePath: resolvePagePath(options.pagePath),
    apiBaseInput,
    resultElement,
    summaryElement,
    requestElement,
    requestStatusElement,
  };
}

export type StatusTone = "neutral" | "running" | "success" | "error";

export function setRequestStatus(
  context: PageContext,
  message: string,
  tone: StatusTone = "neutral",
): void {
  if (context.requestStatusElement == null) {
    return;
  }

  context.requestStatusElement.textContent = message;
  context.requestStatusElement.dataset.tone = tone;
}

export function setFieldMessage(
  documentRef: Document,
  elementId: string,
  message: string,
  tone: Exclude<StatusTone, "running"> = "neutral",
): void {
  const node = documentRef.getElementById(elementId);
  if (node == null) {
    return;
  }

  node.textContent = message;
  node.setAttribute("data-tone", tone);
}

export async function requestJson(
  context: PageContext,
  path: string,
  init?: RequestInit,
): Promise<void> {
  await runApiRequest(context, path, init);
}

export function setupNavigationLogging(context: PageContext): void {
  const links = context.documentRef.querySelectorAll(".nav a");
  for (const link of links) {
    link.addEventListener("click", () => {
      void context.logger.log({
        level: "info",
        event: "ui.navigation.clicked",
        pagePath: context.pagePath,
        details: {
          href: (link as HTMLAnchorElement).getAttribute("href"),
        },
      });
    });
  }
}

export async function logPageViewed(context: PageContext, pageName: string): Promise<void> {
  await context.logger.log({
    level: "info",
    event: "page.viewed",
    pagePath: context.pagePath,
    details: {
      page: pageName,
      apiBaseUrl: apiBaseUrl(context.apiBaseInput),
    },
  });
}
