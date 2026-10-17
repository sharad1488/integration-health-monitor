package com.example.integrationhealth.service;

import com.example.integrationhealth.config.*;
import com.example.integrationhealth.domain.*;
import com.example.integrationhealth.repository.*;

import java.time.*;
import java.util.*;
import java.util.stream.*;

@org.springframework.stereotype.Service
public class HealthService {
    private final LogRepository repo;
    private final HealthProperties cfg;
    private final Clock clock;

    public HealthService(LogRepository r, HealthProperties c, Clock k) {
        repo = r;
        cfg = c;
        clock = k;
    }

    public Map<String, Object> list() {
        return Map.of("generatedAt", clock.instant(), "demonstrationData", true, "integrations", Arrays.stream(Integration.values()).map(this::details).toList());
    }

    public Map<String, Object> details(Integration i) {
        Instant now = clock.instant(), since = now.minus(cfg.getWindow());
        List<RequestLog> all = repo.forIntegration(i),
        recent = all.stream().filter(l -> !l.timestamp().isBefore(since) && !l.timestamp().isAfter(now)).toList();
        long n = recent.size(), fail = recent.stream().filter(RequestLog::failed).count();
        double rate = n == 0 ? 0 : (double) fail / n, lat = n == 0 ? 0 : recent.stream().mapToLong(RequestLog::latencyMs).average().orElse(0);
        int consecutive = 0;
        for (RequestLog l : all) {
            if (l.timestamp().isAfter(now)) continue;
            if (l.failed()) consecutive++;
            else break;
        }
        HealthStatus status = n < cfg.getMinimumSampleSize() ? HealthStatus.UNKNOWN : consecutive >= cfg.getConsecutiveFailureThreshold() || rate >= cfg.getUnhealthyErrorRate() || lat >= cfg.getUnhealthyLatencyMs() ? HealthStatus.UNHEALTHY : rate >= cfg.getDegradedErrorRate() || lat >= cfg.getDegradedLatencyMs() ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
        Instant updated = all.stream().map(RequestLog::timestamp).max(Comparator.naturalOrder()).orElse(null);
        return Map.ofEntries(Map.entry("integration", i), Map.entry("status", status), Map.entry("healthScore", n == 0 ? 0 : Math.max(0, Math.round(100 * (1 - rate)))), Map.entry("errorRate", rate), Map.entry("averageLatencyMs", lat), Map.entry("requestVolume", n), Map.entry("failureCount", fail), Map.entry("consecutiveFailures", consecutive), Map.entry("windowStart", since), Map.entry("generatedAt", now), Map.entry("demonstrationData", true), Map.entry("lastUpdated", updated == null ? "" : updated));
    }

    public List<RequestLog> logs(Integration i, int limit) {
        return repo.forIntegration(i).stream().limit(limit).toList();
    }

    public Map<String, Object> trends(Integration i) {
        List<RequestLog> rows = repo.forIntegration(i);
        return Map.of("integration", i, "errorRate", rows.stream().map(l -> Map.of("timestamp", l.timestamp(), "failed", l.failed() ? 1 : 0)).toList(), "latency", rows.stream().map(l -> Map.of("timestamp", l.timestamp(), "latencyMs", l.latencyMs())).toList(), "errorCodes", rows.stream().filter(RequestLog::failed).collect(Collectors.groupingBy(RequestLog::statusCode, TreeMap::new, Collectors.counting())));
    }
}
