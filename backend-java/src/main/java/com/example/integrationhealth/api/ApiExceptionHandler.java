package com.example.integrationhealth.api;

import java.time.Instant;
import java.util.*;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, ConstraintViolationException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> bad(Exception e) {
        e.printStackTrace();
        return Map.of("timestamp", Instant.now(), "status", 400, "error", "Bad Request", "message", "Invalid integration name or request parameter");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> error(Exception e) {
        e.printStackTrace();
        return Map.of("timestamp", Instant.now(), "status", 500, "error", "Internal Server Error", "message", "Request could not be completed");
    }
}
