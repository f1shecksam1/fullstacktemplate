import {
  API_VERSION_PREFIX,
  createPageContext,
  logPageViewed,
  type PageSetupOptions,
  requestJson,
  setupNavigationLogging,
} from "./shared.js";

export function mountEchoPage(options?: PageSetupOptions): void {
  const context = createPageContext(options);
  if (context == null) {
    return;
  }

  const button = context.documentRef.getElementById("btn-run-echo");
  const input = context.documentRef.getElementById("echo-input") as HTMLInputElement | null;
  if (button == null || input == null) {
    return;
  }

  setupNavigationLogging(context);
  void logPageViewed(context, "echo");

  button.addEventListener("click", () => {
    const message = input.value;
    void context.logger.log({
      level: "info",
      event: "ui.button.clicked",
      pagePath: context.pagePath,
      details: { action: "echo", messageLength: message.length },
    });

    void requestJson(context, `${API_VERSION_PREFIX}/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  });
}
