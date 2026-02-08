import {
  API_VERSION_PREFIX,
  createPageContext,
  logPageViewed,
  type PageSetupOptions,
  requestJson,
  setFieldMessage,
  setRequestStatus,
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
  setRequestStatus(context, "Ready to run echo request.", "neutral");

  const syncEchoGuidance = (): boolean => {
    const isEmpty = input.value.trim().length === 0;
    if (isEmpty) {
      setFieldMessage(
        context.documentRef,
        "echo-help",
        "Message is required before sending request.",
        "error",
      );
    } else {
      setFieldMessage(
        context.documentRef,
        "echo-help",
        `Payload ready (${input.value.trim().length} chars).`,
        "success",
      );
    }

    return !isEmpty;
  };

  input.addEventListener("input", () => {
    syncEchoGuidance();
  });

  syncEchoGuidance();

  button.addEventListener("click", () => {
    const message = input.value.trim();
    if (!syncEchoGuidance()) {
      setRequestStatus(context, "Echo request blocked: message is empty.", "error");
      return;
    }

    setRequestStatus(context, "Running POST /echo...", "running");
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
