package com.example.integrationhealth.api;

import com.example.integrationhealth.domain.*;
import com.example.integrationhealth.repository.*;
import com.example.integrationhealth.service.*;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(value = "*")
@Tag(name = "Integration health", description = "Health status, logs, trends, and sample-log ingestion")
@Validated
public class HealthController {
    private final HealthService health;
    private final LogIngestionService ingestion;
    private final LogRepository repo;

    public HealthController(HealthService h, LogIngestionService s, LogRepository r) {
        health = h;
        ingestion = s;
        repo = r;
    }

    @Operation(summary = "Get health for every integration", description = "Returns deterministic health status for all integrations.")
    @GetMapping("/health")
    public Map<String, Object> health() {
        return health.list();
    }

    @Operation(summary = "Get health details", description = "Returns recent-window health metrics for one integration.")
    @GetMapping("/integrations/{integration}/health")
    public Map<String, Object> detail(@Parameter(description = "Integration identifier", example = "PAYROLL") @PathVariable Integration integration) {
        return health.details(integration);
    }

    @Operation(summary = "List request logs", description = "Returns newest stored request logs for an integration.")
    @GetMapping("/integrations/{integration}/logs")
    public Object logs(@Parameter(description = "Integration identifier", example = "PAYROLL") @PathVariable Integration integration, @Parameter(description = "Maximum records (1–1000)") @RequestParam(defaultValue = "100") @Min(1) @Max(1000) int limit) {
        return health.logs(integration, limit);
    }

    @Operation(summary = "Get integration trends", description = "Returns latency, failures, and failure-code counts.")
    @GetMapping("/integrations/{integration}/trends")
    public Map<String, Object> trends(@PathVariable Integration integration) {
        return health.trends(integration);
    }

    @Operation(summary = "Get ingestion statistics", description = "Reports in-memory accepted, malformed, and duplicate log counts.")
    @GetMapping("/ingestion/stats")
    public Map<String, Object> stats() {
        return Map.of("storedLogs", repo.size(), "malformedLines", ingestion.malformed(), "duplicateLogs", repo.duplicates(), "demonstrationData", true);
    }

    @Operation(summary = "Reload demonstration logs", description = "Clears the in-memory snapshot and reloads configured JSON Lines files.")
    @PostMapping("/logs/reload")
    public Map<String, Object> reload() {
        return ingestion.reload();
    }
}
