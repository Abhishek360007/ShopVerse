package com.shopverse.services;

import com.shopverse.auth.entities.User;
import com.shopverse.auth.repositories.UserDetailRepository;
import com.shopverse.dto.AnalyticsDto;
import com.shopverse.dto.AnalyticsDto.BestSeller;
import com.shopverse.dto.AnalyticsDto.CustomerStats;
import com.shopverse.dto.AnalyticsDto.Kpis;
import com.shopverse.dto.AnalyticsDto.LowStock;
import com.shopverse.dto.AnalyticsDto.MonthPoint;
import com.shopverse.dto.AnalyticsDto.TopCustomer;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Product;
import com.shopverse.entities.Resources;
import com.shopverse.repositories.OrderRepository;
import com.shopverse.repositories.ProductRepository;
import com.shopverse.repositories.ProductVariantRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Sales, product and customer figures for the admin dashboard.
 *
 * <p>Totals, best sellers and top customers are aggregated by the database ({@code SUM},
 * {@code COUNT}, {@code GROUP BY}), so the work doesn't grow with the number of orders
 * held in memory. Only the monthly chart reads individual rows, and only two columns
 * (date and total) for the months it shows; they are grouped by month in Java because
 * months are counted in the store's time zone. Money is summed as {@code BigDecimal}
 * and rounded to two decimals at the end.
 */
@Service
public class AdminAnalyticsService {

    static final ZoneId STORE_ZONE = ZoneId.of("Asia/Kolkata");
    private static final int TOP_N = 5;

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final UserDetailRepository userRepository;
    private final ProductRepository productRepository;

    public AdminAnalyticsService(OrderRepository orderRepository, ProductVariantRepository variantRepository,
                                 UserDetailRepository userRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsDto analytics(int months, int lowStockThreshold) {
        YearMonth thisMonth = YearMonth.now(STORE_ZONE);
        int window = Math.min(Math.max(months, 1), 24);
        // Read at least two months so this month can be compared with last month.
        YearMonth firstMonth = thisMonth.minusMonths(Math.max(window, 2) - 1);
        List<Object[]> recent = orderRepository.datedTotalsSince(startOf(firstMonth));

        List<MonthPoint> monthly = monthly(recent, thisMonth, window);
        List<LowStock> lowStock = lowStock(lowStockThreshold);

        BigDecimal revenue = orZero(orderRepository.sumRevenue());
        long orders = orderRepository.countNotCancelled();
        BigDecimal revenueThis = revenueIn(recent, thisMonth);
        BigDecimal revenueLast = revenueIn(recent, thisMonth.minusMonths(1));
        Double change = revenueLast.signum() > 0
                ? money(revenueThis.subtract(revenueLast).multiply(BigDecimal.valueOf(100))
                        .divide(revenueLast, 2, RoundingMode.HALF_UP))
                : null;
        long ordersThisMonth = recent.stream().filter(r -> thisMonth.equals(monthOf((Date) r[0]))).count();
        long toShip = orderRepository.countByOrderStatusIn(
                List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKED));

        Kpis kpis = new Kpis(money(revenue), orders,
                orders == 0 ? 0 : money(revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP)),
                money(revenueThis), money(revenueLast), change, ordersThisMonth, toShip, lowStock.size());

        return new AnalyticsDto(kpis, monthly, bestSellers(), lowStock.stream().limit(10).toList(),
                customers(thisMonth));
    }

    /** Revenue and order count per month, oldest first, including months with no orders. */
    static List<MonthPoint> monthly(List<Object[]> datedTotals, YearMonth end, int months) {
        Map<YearMonth, List<Object[]>> byMonth = datedTotals.stream()
                .filter(r -> r[0] != null)
                .collect(Collectors.groupingBy(r -> monthOf((Date) r[0])));
        List<MonthPoint> points = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = end.minusMonths(i);
            List<Object[]> inMonth = byMonth.getOrDefault(month, List.of());
            points.add(new MonthPoint(month.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + month.getYear(),
                    money(sum(inMonth)), inMonth.size()));
        }
        return points;
    }

    private List<BestSeller> bestSellers() {
        List<Object[]> rows = orderRepository.bestSellers(PageRequest.of(0, TOP_N));
        List<UUID> ids = rows.stream().map(r -> (UUID) r[0]).toList();
        Map<UUID, Product> products = productRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        return bestSellers(rows, products);
    }

    /** Turns (product id, units, revenue) rows, already sorted by units, into dashboard entries. */
    static List<BestSeller> bestSellers(List<Object[]> rows, Map<UUID, Product> products) {
        return rows.stream()
                .filter(r -> products.containsKey((UUID) r[0]))
                .map(r -> {
                    Product p = products.get((UUID) r[0]);
                    return new BestSeller(p.getId(), p.getName(), thumbnail(p), ((Number) r[1]).longValue(),
                            money(toBigDecimal(r[2])));
                })
                .toList();
    }

    private List<LowStock> lowStock(int threshold) {
        return variantRepository.findByStockQuantityLessThanEqualOrderByStockQuantityAsc(Math.max(threshold, 0)).stream()
                .filter(v -> v.getProduct() != null)
                .map(v -> new LowStock(v.getProduct().getId(), v.getProduct().getName(), v.getSize(), v.getColor(),
                        v.getStockQuantity() == null ? 0 : v.getStockQuantity()))
                .toList();
    }

    private CustomerStats customers(YearMonth thisMonth) {
        List<Object[]> rows = orderRepository.topCustomers(PageRequest.of(0, TOP_N));
        Map<UUID, User> users = userRepository.findByIdIn(rows.stream().map(r -> (UUID) r[0]).toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        List<TopCustomer> top = rows.stream()
                .filter(r -> users.containsKey((UUID) r[0]))
                .map(r -> {
                    User user = users.get((UUID) r[0]);
                    String name = String.join(" ", Optional.ofNullable(user.getFirstName()).orElse(""),
                            Optional.ofNullable(user.getLastName()).orElse("")).trim();
                    return new TopCustomer(name.isEmpty() ? user.getEmail() : name, user.getEmail(),
                            ((Number) r[1]).longValue(), money(toBigDecimal(r[2])));
                })
                .toList();

        return new CustomerStats(userRepository.count(), userRepository.countByCreatedOnGreaterThanEqual(startOf(thisMonth)),
                orderRepository.countPayingCustomers(), orderRepository.repeatCustomerIds().size(), top);
    }

    private static BigDecimal revenueIn(List<Object[]> datedTotals, YearMonth month) {
        return sum(datedTotals.stream().filter(r -> r[0] != null && month.equals(monthOf((Date) r[0]))).toList());
    }

    private static BigDecimal sum(List<Object[]> datedTotals) {
        return datedTotals.stream().map(r -> toBigDecimal(r[1])).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    static YearMonth monthOf(Date date) {
        if (date == null) return null;
        LocalDate day = date.toInstant().atZone(STORE_ZONE).toLocalDate();
        return YearMonth.from(day);
    }

    private static Date startOf(YearMonth month) {
        return Date.from(month.atDay(1).atStartOfDay(STORE_ZONE).toInstant());
    }

    private static String thumbnail(Product product) {
        if (product.getResources() == null) return null;
        return product.getResources().stream().filter(r -> Boolean.TRUE.equals(r.getIsPrimary()))
                .map(Resources::getUrl).findFirst().orElse(null);
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal b) return b;
        return new BigDecimal(value.toString());
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /** Money to two decimals, as a plain number for the dashboard. */
    private static double money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
