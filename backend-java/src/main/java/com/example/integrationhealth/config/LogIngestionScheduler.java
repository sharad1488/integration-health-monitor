package com.example.integrationhealth.config;

import com.example.integrationhealth.domain.Integration;
import com.example.integrationhealth.domain.RequestLog;
import com.example.integrationhealth.repository.LogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LogIngestionScheduler {
    private final LogRepository repo;
    private final ObjectMapper mapper;
    @Scheduled(cron="0 */6 * * * *")
    public synchronized Map<String, Object> reload() {
        repo.clear();
        Path f = Paths.get("F:/learning/AI/intgration_health_monitor_backend_java_self_improved/backend-java/sample-logs/integration_log.json");
        try {
            JsonNode rootNode = mapper.readTree(f.toFile());
            JsonNode arrayNode = rootNode.get("logs");
            for (JsonNode itemNode : arrayNode) {
                System.out.println(itemNode.toString());
                RequestLog l = parse(itemNode);
                repo.add(l);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read json {}", e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return Map.of("files", "files", "linesRead", "read", "accepted", "accepted", "malformed", "bad", "duplicates", repo.duplicates());
    }

    private RequestLog parse(JsonNode n) throws Exception {
        Integration i = Integration.valueOf(req(n, "integration").toUpperCase(Locale.ROOT));
        String id = req(n, "requestId"),
                method = req(n, "method").toUpperCase(Locale.ROOT),
                path = req(n, "path");
        Instant ts = Instant.parse(req(n, "timestamp"));
        int code = n.path("statusCode").asInt(-1);
        long latency = n.path("latencyMs").asLong(-1);
        if (id.length() > 100 ||
                method.length() > 10 ||
                path.length() > 500 ||
                code < 100 ||
                code > 599 ||
                latency < 0){
            throw new IllegalArgumentException("Invalid log");
        }
        return new RequestLog(i, id, ts, method, path, code, latency, n.path("errorMessage").asText(null));
    }

    private String req(JsonNode n, String k) {
        String v = n.path(k).asText("").trim();
        if (v.isEmpty()) throw new IllegalArgumentException("missing " + k);
        return v;
    }

}
