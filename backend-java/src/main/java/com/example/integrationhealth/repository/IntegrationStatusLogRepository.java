package com.example.integrationhealth.repository;

import com.example.integrationhealth.Entity.IntegrationStatusHistoryDetails;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IntegrationStatusLogRepository extends JpaRepository<IntegrationStatusHistoryDetails, Long> {
}
