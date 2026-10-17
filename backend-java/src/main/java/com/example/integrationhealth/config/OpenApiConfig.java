package com.example.integrationhealth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI integrationHealthOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Integration Health API")
                .version("v1")
                .description("Deterministic integration health API. Bundled logs are seeded demonstration data."));
    }
}