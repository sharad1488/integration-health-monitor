package com.example.integrationhealth.config;

import com.example.integrationhealth.service.LogIngestionService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StartupConfig {
    @Bean
    ApplicationRunner loadSampleLogs(LogIngestionService ingestion) {
        return args -> ingestion.reload();
    }
}
