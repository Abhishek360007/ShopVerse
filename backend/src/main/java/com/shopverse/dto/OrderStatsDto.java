package com.shopverse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Sales summary for the admin dashboard. Revenue excludes cancelled orders. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatsDto {
    private long totalOrders;
    private long toShip;          // PENDING + IN_PROGRESS
    private long shipped;
    private long delivered;
    private long cancelled;
    private double revenue;
    private double averageOrderValue;
}
