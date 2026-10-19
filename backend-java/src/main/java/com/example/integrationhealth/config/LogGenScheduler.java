package com.example.integrationhealth.config;

import com.example.integrationhealth.domain.Integration;
import com.example.integrationhealth.domain.RequestLog;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;

@Configuration
@EnableScheduling
public class LogGenScheduler {
    private final ObjectMapper objectMapper;
    private final Path logFile;
    private final Random random = new Random();
    private final AtomicLong requestCounter = new AtomicLong();

    public LogGenScheduler(
            ObjectMapper objectMapper,
            @Value("${app.logs.file:./sample-logs/integration_log.json}") String logFile) {
        this.objectMapper = objectMapper.copy().enable(SerializationFeature.INDENT_OUTPUT);
        this.logFile = Path.of(logFile);
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void generateScheduledLog() throws IOException {
        Instant timestamp = Instant.now();
        List<RequestLog> logs = new ArrayList<>();
        for (Integration integration : Integration.values()) {
            for (int i = 1; i <= 6; i++) {
                int statusCode = generateStatusCode();
                int latencyMs = 100 + random.nextInt(1901);
                String errorMessage = statusCode >= 400 ? generateErrorMessage(statusCode) : null;
                String requestId = integration.toString().toLowerCase() + "-" + requestCounter.incrementAndGet();
                logs.add(new RequestLog(integration, requestId, timestamp, "GET", "/api/v1/check",
                        statusCode, latencyMs, errorMessage));
            }
        }
        writeJsonFile(timestamp, logs);
    }

    private int generateStatusCode() {
        int value = random.nextInt(100);
        if (value < 80) return 200;
        if (value < 90) return 503;
        if (value < 95) return 500;
        return 504;
    }

    private String generateErrorMessage(int statusCode) {
        return switch (statusCode) {
            case 500 -> "internal server error";
            case 503 -> "upstream unavailable";
            case 504 -> "gateway timeout";
            default -> "request failed";
        };
    }

    private void writeJsonFile(Instant timestamp, List<RequestLog> logs) throws IOException {
        Files.createDirectories(logFile.getParent() == null ? Path.of(".") : logFile.getParent());
        objectMapper.writeValue(logFile.toFile(), java.util.Map.of("logs", logs));
        System.out.println("Generated " + logs.size() + " logs at " + timestamp
                + " -> " + logFile.toAbsolutePath());
    }
}
