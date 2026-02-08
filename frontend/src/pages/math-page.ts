import {
  API_VERSION_PREFIX,
  createPageContext,
  logPageViewed,
  type PageSetupOptions,
  requestJson,
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

  button.addEventListener("click", () => {
    const a = Number(inputA.value || "0");
    const b = Number(inputB.value || "0");
    const query = new URLSearchParams({ a: String(a), b: String(b) });

    void context.logger.log({
      level: "info",
      event: "ui.button.clicked",
      pagePath: context.pagePath,
      details: { action: "math_add", a, b },
    });

    void requestJson(context, `${API_VERSION_PREFIX}/math/add?${query.toString()}`);
  });
}
