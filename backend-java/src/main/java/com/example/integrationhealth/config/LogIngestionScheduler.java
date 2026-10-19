package com.example.integrationhealth.config;

import com.example.integrationhealth.domain.Integration;
import com.example.integrationhealth.domain.RequestLog;
import com.example.integrationhealth.repository.LogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@Service
public class LogIngestionScheduler {
    private final LogRepository repo;
    private final ObjectMapper mapper;
    private final Path logFile;

    public LogIngestionScheduler(
            LogRepository repo,
            ObjectMapper mapper,
            @Value("${app.logs.file:./sample-logs/integration_log.json}") String logFile) {
        this.repo = repo;
        this.mapper = mapper;
        this.logFile = Path.of(logFile);
    }

    @Scheduled(cron = "0 */6 * * * *")
    public synchronized Map<String, Object> reload() {
        repo.clear();
        try {
            JsonNode rootNode = mapper.readTree(logFile.toFile());
            JsonNode arrayNode = rootNode.path("logs");
            if (!arrayNode.isArray()) {
                throw new IllegalStateException("Expected a 'logs' array in " + logFile.toAbsolutePath());
            }
            int accepted = 0;
            int malformed = 0;
            for (JsonNode itemNode : arrayNode) {
                try {
                    if (repo.add(parse(itemNode))) {
                        accepted++;
                    }
                } catch (Exception e) {
                    malformed++;
                }
            }
            return Map.of(
                    "file", logFile.toAbsolutePath().toString(),
                    "linesRead", arrayNode.size(),
                    "accepted", accepted,
                    "malformed", malformed,
                    "duplicates", repo.duplicates());
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read log file: " + logFile.toAbsolutePath(), e);
        }
    }

    private RequestLog parse(JsonNode n) {
        Integration integration = Integration.valueOf(req(n, "integration").toUpperCase(Locale.ROOT));
        String id = req(n, "requestId");
        String method = req(n, "method").toUpperCase(Locale.ROOT);
        String path = req(n, "path");
        Instant timestamp = Instant.parse(req(n, "timestamp"));
        int code = n.path("statusCode").asInt(-1);
        long latency = n.path("latencyMs").asLong(-1);
        if (id.length() > 100 || method.length() > 10 || path.length() > 500
                || code < 100 || code > 599 || latency < 0) {
            throw new IllegalArgumentException("Invalid log record");
        }
        return new RequestLog(integration, id, timestamp, method, path, code, latency,
                n.path("errorMessage").asText(null));
    }

    private String req(JsonNode n, String key) {
        String value = n.path(key).asText("").trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("Missing " + key);
        }
        return value;
    }
}
