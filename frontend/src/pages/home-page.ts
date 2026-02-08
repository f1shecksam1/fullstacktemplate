import {
  API_VERSION_PREFIX,
  createPageContext,
  logPageViewed,
  type PageSetupOptions,
  requestJson,
  setRequestStatus,
  setupNavigationLogging,
} from "./shared.js";

export async function mountHomePage(options?: PageSetupOptions): Promise<void> {
  const context = createPageContext(options);
  if (context == null) {
    return;
  }

  setupNavigationLogging(context);
  await logPageViewed(context, "home");
  setRequestStatus(context, "Ready to continue.", "neutral");

  const stopButton = context.documentRef.getElementById("btn-stop-project");
  if (stopButton != null) {
    stopButton.addEventListener("click", () => {
      setRequestStatus(context, "Stopping services...", "running");
      void context.logger.log({
        level: "warning",
        event: "ui.button.clicked",
        pagePath: context.pagePath,
        details: { action: "stop_project" },
      });
      void requestJson(context, `${API_VERSION_PREFIX}/admin/stop-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    });
  }
}
