export function renderOperationResult(
  resultElement: HTMLElement,
  summaryElement: HTMLElement | null,
  payload: unknown,
  summary: string,
): void {
  resultElement.textContent = JSON.stringify(payload, null, 2);
  if (summaryElement != null) {
    summaryElement.textContent = summary;
  }
}

export function renderOperationError(
  resultElement: HTMLElement,
  summaryElement: HTMLElement | null,
  payload: unknown,
  summary: string,
): void {
  resultElement.textContent = JSON.stringify(payload, null, 2);
  if (summaryElement != null) {
    summaryElement.textContent = summary;
  }
}

export function renderRequestPayload(requestElement: HTMLElement | null, payload: unknown): void {
  if (requestElement == null) {
    return;
  }

  requestElement.textContent = JSON.stringify(payload, null, 2);
}
