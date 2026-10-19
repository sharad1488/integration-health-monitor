package com.example.integrationhealth.repository;

import com.example.integrationhealth.domain.*;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.LongAdder;

@Repository
public class LogRepository {
    private final Map<String, RequestLog> logs = new ConcurrentHashMap<>();
    private final LongAdder duplicates = new LongAdder();

    public boolean add(RequestLog l) {
        if (logs.putIfAbsent(l.integration() + ":" + l.requestId(), l) != null) {
            duplicates.increment();
            return false;
        }
        return true;
    }

    public List<RequestLog> all() {
        return logs.values().stream().sorted(Comparator.comparing(RequestLog::timestamp).reversed()).toList();
    }

    public List<RequestLog> forIntegration(Integration i) {
        return all().stream().filter(l -> l.integration() == i).toList();
    }

    public long size() {
        return logs.size();
    }

    public long duplicates() {
        return duplicates.sum();
    }

    public void clear() {
        logs.clear();
        duplicates.reset();
    }
}
