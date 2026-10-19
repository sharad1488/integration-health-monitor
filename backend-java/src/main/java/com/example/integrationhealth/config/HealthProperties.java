package com.example.integrationhealth.config;

import java.time.Duration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.health")
@Getter
@Setter
public class HealthProperties {
    private Duration window = Duration.ofMinutes(15);
    private int minimumSampleSize;
    private double degradedErrorRate;
    private double unhealthyErrorRate;
    private long degradedLatencyMs;
    private long unhealthyLatencyMs;
    private int consecutiveFailureThreshold;

}
