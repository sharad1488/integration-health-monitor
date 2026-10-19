package com.example.integrationhealth.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StartupConfig {
    @Bean
    ApplicationRunner loadSampleLogs(LogIngestionScheduler ingestion) {
        return args -> ingestion.reload();
    }
}
