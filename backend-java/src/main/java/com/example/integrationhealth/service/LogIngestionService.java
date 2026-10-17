package com.example.integrationhealth.service;

import com.example.integrationhealth.domain.*;
import com.example.integrationhealth.repository.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;

@Service
public class LogIngestionService {
    private final LogRepository repo;
    private final ObjectMapper mapper;
    private final Path directory;
    private volatile long malformed;

    public LogIngestionService(LogRepository r, ObjectMapper m, @org.springframework.beans.factory.annotation.Value("${app.logs.directory:./sample-logs}") String d) {
        repo = r;
        mapper = m;
        directory = Paths.get(d);
    }

    public synchronized Map<String, Object> reload() {
        repo.clear();
        long bad = 0, read = 0, accepted = 0;
        Map<String, Integer> files = new LinkedHashMap<>();
        for (Integration i : Integration.values()) {
            Path f = directory.resolve(i + ".log");
            int count = 0;
            if (Files.isRegularFile(f)) try (var lines = Files.lines(f)) {
                for (String line : lines.toList()) {
                    if (line.isBlank()) continue;
                    read++;
                    count++;
                    try {
                        RequestLog l = parse(line, i);
                        if (repo.add(l)) accepted++;
                    } catch (Exception e) {
                        bad++;
                    }
                }
            } catch (IOException e) {
                throw new IllegalStateException("Unable to read " + f, e);
            }
            files.put(f.getFileName().toString(), count);
        }
        malformed = bad;
        return Map.of("files", files, "linesRead", read, "accepted", accepted, "malformed", bad, "duplicates", repo.duplicates());
    }

    private RequestLog parse(String s, Integration source) throws Exception {
        JsonNode n = mapper.readTree(s);
        Integration i = Integration.valueOf(req(n, "integration").toUpperCase(Locale.ROOT));
        if (i != source) throw new IllegalArgumentException("Wrong source file");
        String id = req(n, "requestId"), method = req(n, "method").toUpperCase(Locale.ROOT), path = req(n, "path");
        Instant ts = Instant.parse(req(n, "timestamp"));
        int code = n.path("statusCode").asInt(-1);
        long latency = n.path("latencyMs").asLong(-1);
        if (id.length() > 100 || method.length() > 10 || path.length() > 500 || code < 100 || code > 599 || latency < 0)
            throw new IllegalArgumentException("Invalid log");
        return new RequestLog(i, id, ts, method, path, code, latency, n.path("errorMessage").asText(null));
    }

    private String req(JsonNode n, String k) {
        String v = n.path(k).asText("").trim();
        if (v.isEmpty()) throw new IllegalArgumentException("missing " + k);
        return v;
    }

    public long malformed() {
        return malformed;
    }
}
