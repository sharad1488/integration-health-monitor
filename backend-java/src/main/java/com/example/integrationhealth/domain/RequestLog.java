package com.example.integrationhealth.domain;

import java.time.Instant;

public record RequestLog(Integration integration,
                         String requestId,
                         Instant timestamp,
                         String method,
                         String path,
                         int statusCode, long latencyMs, String errorMessage) {
    public boolean failed() {
        return statusCode >= 500 || statusCode == 408 || statusCode == 504;
    }
}
