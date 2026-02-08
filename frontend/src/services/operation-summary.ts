function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export function describeOperation(
  path: string,
  method: string,
  data: unknown,
  statusCode: number,
): string {
  const payload = asRecord(data);

  if (statusCode < 200 || statusCode >= 300) {
    return `Istek basarisiz: ${method} ${path} (HTTP ${statusCode})`;
  }

  if (path.startsWith("/api/v1/health")) {
    return `Saglik kontrolu tamamlandi: status=${String(payload.status ?? "ok")}`;
  }

  if (path.startsWith("/api/v1/time")) {
    return `Sunucu zamani alindi: ${String(payload.utc ?? "bilinmiyor")}`;
  }

  if (path.startsWith("/api/v1/echo")) {
    const echoed = String(payload.echoed ?? "");
    const length = String(payload.length ?? echoed.length);
    return `Echo islemi tamamlandi: "${echoed}" (uzunluk=${length})`;
  }

  if (path.startsWith("/api/v1/math/add")) {
    const a = Number(payload.a ?? 0);
    const b = Number(payload.b ?? 0);
    const result = Number(payload.result ?? a + b);
    return `Toplama islemi: ${a} + ${b} = ${result}`;
  }

  if (path.startsWith("/api/v1/admin/stop-project")) {
    return "Kapatma komutu gonderildi: backend ve frontend durduruluyor.";
  }

  return `Istek basarili: ${method} ${path} (HTTP ${statusCode})`;
}
