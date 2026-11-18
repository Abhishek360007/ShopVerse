package com.shopverse.services;

import com.shopverse.dto.AnalyticsDto.BestSeller;
import com.shopverse.dto.AnalyticsDto.MonthPoint;
import com.shopverse.entities.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminAnalyticsServiceTest {

    private static Date dayIn(YearMonth month) {
        return Date.from(month.atDay(10).atStartOfDay(AdminAnalyticsService.STORE_ZONE).toInstant());
    }

    /** One (order date, total) row, as the repository's datedTotalsSince query returns it. */
    private static Object[] row(YearMonth month, String total) {
        return new Object[]{dayIn(month), new BigDecimal(total)};
    }

    @Test
    void groupsRevenueByMonthIncludingEmptyMonths() {
        YearMonth now = YearMonth.of(2026, 11);
        List<Object[]> rows = List.of(row(now, "1000"), row(now, "500"), row(now.minusMonths(2), "250"));

        List<MonthPoint> points = AdminAnalyticsService.monthly(rows, now, 3);

        assertEquals(List.of("2026-09", "2026-10", "2026-11"), points.stream().map(MonthPoint::month).toList());
        assertEquals(List.of(250.0, 0.0, 1500.0), points.stream().map(MonthPoint::revenue).toList());
        assertEquals(List.of(1L, 0L, 2L), points.stream().map(MonthPoint::orders).toList());
        assertEquals("Nov 2026", points.get(2).label());
    }

    @Test
    void addsMoneyExactly() {
        // 0.1 + 0.2 is 0.30000000000000004 as doubles; as BigDecimal it is exactly 0.30
        YearMonth now = YearMonth.of(2026, 11);
        List<MonthPoint> points = AdminAnalyticsService.monthly(List.of(row(now, "0.10"), row(now, "0.20")), now, 1);

        assertEquals(0.3, points.get(0).revenue());
    }

    @Test
    void turnsBestSellerRowsIntoEntriesInTheirOrder() {
        Product mug = Product.builder().id(UUID.randomUUID()).name("Mug").price(new BigDecimal("299")).build();
        Product shirt = Product.builder().id(UUID.randomUUID()).name("Shirt").price(new BigDecimal("1299")).build();
        UUID removed = UUID.randomUUID();
        // product id, units sold, revenue: already sorted by units by the database
        List<Object[]> rows = List.of(
                new Object[]{mug.getId(), 3L, new BigDecimal("897.00")},
                new Object[]{removed, 2L, new BigDecimal("100.00")},
                new Object[]{shirt.getId(), 2L, new BigDecimal("2498.00")});

        List<BestSeller> best = AdminAnalyticsService.bestSellers(rows,
                Map.of(mug.getId(), mug, shirt.getId(), shirt));

        assertEquals(List.of("Mug", "Shirt"), best.stream().map(BestSeller::name).toList()); // deleted product skipped
        assertEquals(3, best.get(0).unitsSold());
        assertEquals(897.0, best.get(0).revenue());
        assertEquals(2498.0, best.get(1).revenue());
    }
}
