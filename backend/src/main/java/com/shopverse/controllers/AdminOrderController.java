package com.shopverse.controllers;

import com.shopverse.dto.AdminOrderDto;
import com.shopverse.dto.OrderStatsDto;
import com.shopverse.entities.OrderStatus;
import com.shopverse.services.AdminOrderService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Order management for the admin panel. Secured to ADMIN in WebSecurityConfig. */
@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public List<AdminOrderDto> list(@RequestParam(required = false) String status,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "25") int size,
                                    HttpServletResponse response) {
        Page<AdminOrderDto> result = adminOrderService.list(parseStatus(status), page, size);
        // react-admin reads the total from Content-Range
        response.setHeader("Content-Range", "orders " + page * size + "-" + (page * size + result.getNumberOfElements())
                + "/" + result.getTotalElements());
        return result.getContent();
    }

    @GetMapping("/stats")
    public OrderStatsDto stats() {
        return adminOrderService.stats();
    }

    @GetMapping("/{id}")
    public AdminOrderDto get(@PathVariable UUID id) {
        return adminOrderService.get(id);
    }

    @PutMapping("/{id}")
    public AdminOrderDto update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Object status = body.get("orderStatus");
        return adminOrderService.updateStatus(id, parseStatus(status == null ? null : status.toString()));
    }

    private static OrderStatus parseStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OrderStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown order status: " + value);
        }
    }
}
