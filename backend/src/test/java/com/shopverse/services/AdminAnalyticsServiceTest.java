package com.shopverse.services;

import com.shopverse.dto.AnalyticsDto.BestSeller;
import com.shopverse.dto.AnalyticsDto.MonthPoint;
import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminAnalyticsServiceTest {

    private static Date dayIn(YearMonth month) {
        return Date.from(month.atDay(10).atStartOfDay(AdminAnalyticsService.STORE_ZONE).toInstant());
    }

    private static Order order(YearMonth month, double total, OrderItem... items) {
        return Order.builder().orderDate(dayIn(month)).totalAmount(total).orderStatus(OrderStatus.DELIVERED)
                .orderItemList(List.of(items)).build();
    }

    @Test
    void groupsRevenueByMonthIncludingEmptyMonths() {
        YearMonth now = YearMonth.of(2026, 11);
        List<Order> orders = List.of(order(now, 1000), order(now, 500), order(now.minusMonths(2), 250));

        List<MonthPoint> points = AdminAnalyticsService.monthly(orders, now, 3);

        assertEquals(List.of("2026-09", "2026-10", "2026-11"), points.stream().map(MonthPoint::month).toList());
        assertEquals(List.of(250.0, 0.0, 1500.0), points.stream().map(MonthPoint::revenue).toList());
        assertEquals(List.of(1L, 0L, 2L), points.stream().map(MonthPoint::orders).toList());
        assertEquals("Nov 2026", points.get(2).label());
    }

    @Test
    void ranksBestSellersByUnits() {
        Product shirt = Product.builder().id(UUID.randomUUID()).name("Shirt").price(new BigDecimal("1299")).build();
        Product mug = Product.builder().id(UUID.randomUUID()).name("Mug").price(new BigDecimal("299")).build();
        YearMonth m = YearMonth.of(2026, 11);
        List<Order> orders = List.of(
                order(m, 0, OrderItem.builder().product(shirt).quantity(1).itemPrice(1299.0).build(),
                        OrderItem.builder().product(mug).quantity(3).build()),
                order(m, 0, OrderItem.builder().product(shirt).quantity(1).itemPrice(1199.0).build()));

        List<BestSeller> best = AdminAnalyticsService.bestSellers(orders);

        assertEquals(List.of("Mug", "Shirt"), best.stream().map(BestSeller::name).toList());
        assertEquals(3, best.get(0).unitsSold());
        assertEquals(897.0, best.get(0).revenue());       // falls back to catalog price
        assertEquals(2498.0, best.get(1).revenue());      // uses the price paid on each order
    }
}
