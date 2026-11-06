package com.shopverse.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight liveness check for the hosting health check and the keep-alive job.
 * It deliberately does not touch the database, so pinging it keeps the API awake
 * while letting the (serverless) database sleep when nobody is shopping.
 */
@RestController
@CrossOrigin
public class PingController {

    @GetMapping("/api/ping")
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }
}
