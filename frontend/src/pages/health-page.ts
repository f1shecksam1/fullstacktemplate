import {
  API_VERSION_PREFIX,
  createPageContext,
  logPageViewed,
  type PageSetupOptions,
  requestJson,
  setupNavigationLogging,
} from "./shared.js";

export function mountHealthPage(options?: PageSetupOptions): void {
  const context = createPageContext(options);
  if (context == null) {
    return;
  }

  const button = context.documentRef.getElementById("btn-run-health");
  if (button == null) {
    return;
  }

  setupNavigationLogging(context);
  void logPageViewed(context, "health");

  button.addEventListener("click", () => {
    void context.logger.log({
      level: "info",
      event: "ui.button.clicked",
      pagePath: context.pagePath,
      details: { action: "health" },
    });
    void requestJson(context, `${API_VERSION_PREFIX}/health`);
  });
}
