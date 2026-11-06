package com.shopverse.dto;

import java.util.List;
import java.util.UUID;

/** Everything the admin dashboard shows, in one response. */
public record AnalyticsDto(
        Kpis kpis,
        List<MonthPoint> monthly,
        List<BestSeller> bestSellers,
        List<LowStock> lowStock,
        CustomerStats customers) {

    /** Headline numbers. Revenue excludes cancelled orders. */
    public record Kpis(double revenue, long orders, double averageOrderValue,
                       double revenueThisMonth, double revenueLastMonth, Double revenueChangePercent,
                       long ordersThisMonth, long toShip, long lowStockCount) {
    }

    public record MonthPoint(String month, String label, double revenue, long orders) {
    }

    public record BestSeller(UUID productId, String name, String thumbnail, long unitsSold, double revenue) {
    }

    public record LowStock(UUID productId, String productName, String size, String color, int stock) {
    }

    public record CustomerStats(long totalCustomers, long newThisMonth, long payingCustomers,
                                long repeatCustomers, List<TopCustomer> topCustomers) {
    }

    public record TopCustomer(String name, String email, long orders, double spent) {
    }
}
