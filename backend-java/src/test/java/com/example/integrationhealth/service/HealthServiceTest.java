package com.example.integrationhealth.service;

import com.example.integrationhealth.config.HealthProperties;
import com.example.integrationhealth.domain.*;
import com.example.integrationhealth.repository.LogRepository;

import java.time.*;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HealthServiceTest {
    @Test
    void missingDataIsUnknown() {
        var h = new HealthService(new LogRepository(), new HealthProperties(), Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneOffset.UTC));
        assertEquals(HealthStatus.UNKNOWN, h.details(Integration.PAYROLL).get("status"));
    }

    @Test
    void serverFailuresMakeIntegrationUnhealthyAndFourHundredsDoNotCount() {
        var r = new LogRepository();
        var p = new HealthProperties();
        var c = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneOffset.UTC);
        for (int x = 0; x < 5; x++)
            r.add(new RequestLog(Integration.PAYROLL, "p" + x, c.instant().minusSeconds(x), "GET", "/", 503, 20, null));
        for (int x = 0; x < 5; x++)
            r.add(new RequestLog(Integration.ATS, "a" + x, c.instant().minusSeconds(x), "GET", "/", 404, 20, null));
        var h = new HealthService(r, p, c);
        assertEquals(HealthStatus.UNHEALTHY, h.details(Integration.PAYROLL).get("status"));
        assertEquals(HealthStatus.HEALTHY, h.details(Integration.ATS).get("status"));
    }
}
