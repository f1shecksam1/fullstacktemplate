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

export function mountMathPage(options?: PageSetupOptions): void {
  const context = createPageContext(options);
  if (context == null) {
    return;
  }

  const button = context.documentRef.getElementById("btn-run-add");
  const inputA = context.documentRef.getElementById("add-a") as HTMLInputElement | null;
  const inputB = context.documentRef.getElementById("add-b") as HTMLInputElement | null;
  if (button == null || inputA == null || inputB == null) {
    return;
  }

  setupNavigationLogging(context);
  void logPageViewed(context, "math");
  setRequestStatus(context, "Ready to run math request.", "neutral");

  const syncMathGuidance = (): boolean => {
    const rawA = inputA.value.trim();
    const rawB = inputB.value.trim();
    const valid = rawA.length > 0 && rawB.length > 0;

    if (!valid) {
      setFieldMessage(
        context.documentRef,
        "math-help",
        "Both A and B are required before calculation.",
        "error",
      );
      return false;
    }

    setFieldMessage(context.documentRef, "math-help", `Ready: ${rawA} + ${rawB}`, "success");
    return true;
  };

  inputA.addEventListener("input", () => {
    syncMathGuidance();
  });

  inputB.addEventListener("input", () => {
    syncMathGuidance();
  });

  syncMathGuidance();

  button.addEventListener("click", () => {
    if (!syncMathGuidance()) {
      setRequestStatus(context, "Math request blocked: missing inputs.", "error");
      return;
    }

    const a = Number(inputA.value || "0");
    const b = Number(inputB.value || "0");
    const query = new URLSearchParams({ a: String(a), b: String(b) });
    setRequestStatus(context, "Running GET /math/add...", "running");

    void context.logger.log({
      level: "info",
      event: "ui.button.clicked",
      pagePath: context.pagePath,
      details: { action: "math_add", a, b },
    });

    void requestJson(context, `${API_VERSION_PREFIX}/math/add?${query.toString()}`);
  });
}
