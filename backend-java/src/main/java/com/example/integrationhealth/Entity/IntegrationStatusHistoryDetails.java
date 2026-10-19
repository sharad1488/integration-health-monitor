package com.example.integrationhealth.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "INTEGRATION_LOGS")
@Getter
@Setter
public class IntegrationStatusHistoryDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String integration;
    private String status;
    private long healthScore;
    private double errorRate;
    private double averageLatencyMs;
    private long requestVolume;
    private long failureCount;
    private int consecutiveFailures;
    private Instant windowStart;
    private Instant generatedAt;
    private boolean  demonstrationData;
    private Instant lastUpdated;
}
