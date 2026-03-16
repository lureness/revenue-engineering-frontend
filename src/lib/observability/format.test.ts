import {
  formatDuration,
  formatPercentage,
  getApiMetricAverageDuration,
  getStatusTone,
  getTimeseriesBarHeight,
  getTimeseriesErrorHeight,
  getTimeseriesPeak,
} from "@/lib/observability/format";

describe("observability format helpers", () => {
  it("formata percentuais em pt-BR", () => {
    expect(formatPercentage(12.34)).toBe("12,3%");
  });

  it("formata durações curtas e longas", () => {
    expect(formatDuration(245)).toBe("245 ms");
    expect(formatDuration(1250)).toBe("1,25 s");
  });

  it("calcula pico e alturas da série temporal", () => {
    const items = [
      {
        bucket_start: "2026-03-16T10:00:00Z",
        total_requests: 10,
        error_requests: 2,
        average_duration_ms: 120,
      },
      {
        bucket_start: "2026-03-16T11:00:00Z",
        total_requests: 20,
        error_requests: 5,
        average_duration_ms: 180,
      },
    ];

    const peak = getTimeseriesPeak(items);

    expect(peak).toBe(20);
    expect(getTimeseriesBarHeight(items[0], peak)).toBe(50);
    expect(getTimeseriesErrorHeight(items[1], peak)).toBe(25);
  });

  it("classifica o tom do status http", () => {
    expect(
      getStatusTone({
        status_code: 200,
        total_requests: 1,
        error_requests: 0,
      }),
    ).toBe("success");
    expect(
      getStatusTone({
        status_code: 404,
        total_requests: 1,
        error_requests: 1,
      }),
    ).toBe("warning");
    expect(
      getStatusTone({
        status_code: 500,
        total_requests: 1,
        error_requests: 1,
      }),
    ).toBe("destructive");
  });

  it("calcula a duração média de uma métrica agregada", () => {
    expect(
      getApiMetricAverageDuration({
        id: "metric-1",
        tenant_id: "tenant-1",
        bucket_start: "2026-03-16T10:00:00Z",
        method: "GET",
        route_path: "/api/v1/health",
        status_code: 200,
        total_requests: 4,
        error_requests: 0,
        total_duration_ms: 800,
        min_duration_ms: 150,
        max_duration_ms: 250,
        last_seen_at: "2026-03-16T10:10:00Z",
        created_at: "2026-03-16T10:00:00Z",
        updated_at: "2026-03-16T10:10:00Z",
      }),
    ).toBe(200);
  });
});
