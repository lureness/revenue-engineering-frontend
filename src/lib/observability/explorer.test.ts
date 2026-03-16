import { describe, expect, it } from "vitest";

import {
  buildApiRequestLogsQuery,
  buildApiRequestMetricsQuery,
} from "@/lib/observability/explorer";

describe("observability explorer helpers", () => {
  it("normaliza filtros de logs e aplica limite padrão", () => {
    expect(
      buildApiRequestLogsQuery({
        method: " post ",
        statusCode: "502",
        routePath: " /api/v1/auth/login ",
        requestId: " req-123 ",
        limit: "",
      }),
    ).toEqual({
      method: "POST",
      status_code: 502,
      route_path: "/api/v1/auth/login",
      request_id: "req-123",
      limit: 30,
    });
  });

  it("normaliza filtros de métricas e cria a janela temporal do recorte", () => {
    const query = buildApiRequestMetricsQuery(
      {
        method: " get ",
        statusCode: "",
        routePath: "/api/v1/messages",
        limit: "999",
      },
      24,
      new Date("2026-03-16T12:00:00.000Z"),
    );

    expect(query).toEqual({
      method: "GET",
      status_code: undefined,
      route_path: "/api/v1/messages",
      start_at: "2026-03-15T12:00:00.000Z",
      end_at: "2026-03-16T12:00:00.000Z",
      limit: 500,
    });
  });
});
