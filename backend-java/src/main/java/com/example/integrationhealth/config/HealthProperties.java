package com.example.integrationhealth.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.health")
public class HealthProperties {
    private Duration window = Duration.ofMinutes(15);
    private int minimumSampleSize = 5;
    private double degradedErrorRate = .05, unhealthyErrorRate = .20;
    private long degradedLatencyMs = 1000, unhealthyLatencyMs = 3000;
    private int consecutiveFailureThreshold = 3;

    public Duration getWindow() {
        return window;
    }

    public void setWindow(Duration v) {
        window = v;
    }

    public int getMinimumSampleSize() {
        return minimumSampleSize;
    }

    public void setMinimumSampleSize(int v) {
        minimumSampleSize = v;
    }

    public double getDegradedErrorRate() {
        return degradedErrorRate;
    }

    public void setDegradedErrorRate(double v) {
        degradedErrorRate = v;
    }

    public double getUnhealthyErrorRate() {
        return unhealthyErrorRate;
    }

    public void setUnhealthyErrorRate(double v) {
        unhealthyErrorRate = v;
    }

    public long getDegradedLatencyMs() {
        return degradedLatencyMs;
    }

    public void setDegradedLatencyMs(long v) {
        degradedLatencyMs = v;
    }

    public long getUnhealthyLatencyMs() {
        return unhealthyLatencyMs;
    }

    public void setUnhealthyLatencyMs(long v) {
        unhealthyLatencyMs = v;
    }

    public int getConsecutiveFailureThreshold() {
        return consecutiveFailureThreshold;
    }

    public void setConsecutiveFailureThreshold(int v) {
        consecutiveFailureThreshold = v;
    }
}
