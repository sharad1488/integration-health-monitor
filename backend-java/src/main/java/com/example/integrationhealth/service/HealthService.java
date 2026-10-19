package com.example.integrationhealth.service;

import com.example.integrationhealth.Entity.IntegrationStatusHistoryDetails;
import com.example.integrationhealth.config.*;
import com.example.integrationhealth.domain.*;
import com.example.integrationhealth.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthService {
    private final LogRepository repo;
    private final HealthProperties cfg;
    private final Clock clock;

    private final IntegrationStatusLogRepository integrationStatusLogRepository;

    public Map<String, Object> list() {
        return Map.of("generatedAt", clock.instant(), "demonstrationData", true, "integrations", Arrays.stream(Integration.values()).map(this::details).toList());
    }

    public Map<String, Object> details(Integration i) {
        Instant now = clock.instant();
        log.info("Now time :: {}", now);
        Instant since = now.minus(cfg.getWindow());
        log.info("15 min before time :: {}", since);
        List<RequestLog> all = repo.forIntegration(i);
        List<RequestLog> recent = all.stream().filter(l -> !l.timestamp().isBefore(since) && !l.timestamp().isAfter(now)).toList();
        log.info("all request log size {} ",all.size());
        log.info("recent log size for time window {} ",recent.size());
        long integrationLogSize = recent.size();
        long failedReqCount = recent.stream().filter(RequestLog::failed).count();
        log.info("failedReqCount {}",failedReqCount);
        double rate = integrationLogSize == 0 ? 0 : (double) failedReqCount / integrationLogSize;
        double lat = integrationLogSize == 0 ? 0 : recent.stream().mapToLong(RequestLog::latencyMs).average().orElse(0);
        int consecutive = 0;
        for (RequestLog l : all) {
            if (l.timestamp().isAfter(now)) continue;
            if (l.failed()) consecutive++;
            else break;
        }
        HealthStatus status = failedReqCount >= cfg.getMinimumSampleSize() || recent.size() ==0 ? HealthStatus.UNKNOWN : consecutive >= cfg.getConsecutiveFailureThreshold() || rate >= cfg.getUnhealthyErrorRate() || lat >= cfg.getUnhealthyLatencyMs() ? HealthStatus.UNHEALTHY : rate >= cfg.getDegradedErrorRate() || lat >= cfg.getDegradedLatencyMs() ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;
        Instant updated = all.stream().map(RequestLog::timestamp).max(Comparator.naturalOrder()).orElse(null);
        Map<String, Object> mapObj = Map.ofEntries(Map.entry("integration", i),
                Map.entry("status", status),
                Map.entry("healthScore", failedReqCount == 0 ? 0 : Math.max(0, Math.round(100 * (1 - rate)))),
                Map.entry("errorRate", rate),
                Map.entry("averageLatencyMs", lat),
                Map.entry("requestVolume", failedReqCount),
                Map.entry("failureCount", failedReqCount),
                Map.entry("consecutiveFailures", consecutive),
                Map.entry("windowStart", since),
                Map.entry("generatedAt", now),
                Map.entry("demonstrationData", true),
                Map.entry("lastUpdated", updated == null ? "" : updated));
        saveCalculatedHistoryData(mapObj);
        return mapObj;
    }

    public List<RequestLog> logs(Integration i, int limit) {
        return repo.forIntegration(i).stream().limit(limit).toList();
    }

    public Map<String, Object> trends(Integration i) {
        List<RequestLog> rows = repo.forIntegration(i);
        return Map.of("integration", i, "errorRate", rows.stream().map(l -> Map.of("timestamp", l.timestamp(), "failed", l.failed() ? 1 : 0)).toList(), "latency", rows.stream().map(l -> Map.of("timestamp", l.timestamp(), "latencyMs", l.latencyMs())).toList(), "errorCodes", rows.stream().filter(RequestLog::failed).collect(Collectors.groupingBy(RequestLog::statusCode, TreeMap::new, Collectors.counting())));
    }

    public void saveCalculatedHistoryData(Map<String, Object> mapObj){
        try {
            IntegrationStatusHistoryDetails historyDetails = new IntegrationStatusHistoryDetails();
            //historyDetails.setId();
            historyDetails.setStatus(String.valueOf(mapObj.get("status")));
            historyDetails.setIntegration(String.valueOf(mapObj.get("integration")));
            historyDetails.setHealthScore((Long) mapObj.get("healthScore"));
            historyDetails.setErrorRate((Double) mapObj.get("errorRate"));
            historyDetails.setAverageLatencyMs((Double) mapObj.get("averageLatencyMs"));
            historyDetails.setRequestVolume((Long) mapObj.get("requestVolume"));
            historyDetails.setFailureCount((Long) mapObj.get("failureCount"));
            historyDetails.setConsecutiveFailures((Integer) mapObj.get("consecutiveFailures"));
            historyDetails.setWindowStart((Instant) mapObj.get("windowStart"));
            historyDetails.setGeneratedAt((Instant) mapObj.get("generatedAt"));
            historyDetails.setDemonstrationData((Boolean) mapObj.get("demonstrationData"));
            historyDetails.setLastUpdated((Instant) mapObj.get("lastUpdated"));

            integrationStatusLogRepository.save(historyDetails);
        }catch(Exception e){
            e.printStackTrace();
        }
    }
}
