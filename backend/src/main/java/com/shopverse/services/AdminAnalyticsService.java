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
import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Product;
import com.shopverse.entities.Resources;
import com.shopverse.repositories.OrderRepository;
import com.shopverse.repositories.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Sales, product and customer figures for the admin dashboard.
 * Computed in memory from the orders, which is plenty fast for a store of this size;
 * a larger store would move these to SQL aggregate queries.
 */
@Service
public class AdminAnalyticsService {

    static final ZoneId STORE_ZONE = ZoneId.of("Asia/Kolkata");

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final UserDetailRepository userRepository;

    public AdminAnalyticsService(OrderRepository orderRepository, ProductVariantRepository variantRepository,
                                 UserDetailRepository userRepository) {
        this.orderRepository = orderRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsDto analytics(int months, int lowStockThreshold) {
        List<Order> all = orderRepository.findAll();
        List<Order> counted = all.stream().filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED).toList();
        YearMonth thisMonth = YearMonth.now(STORE_ZONE);

        List<MonthPoint> monthly = monthly(counted, thisMonth, Math.min(Math.max(months, 1), 24));
        List<LowStock> lowStock = lowStock(lowStockThreshold);

        double revenue = counted.stream().mapToDouble(o -> nz(o.getTotalAmount())).sum();
        double revenueThis = revenueIn(counted, thisMonth);
        double revenueLast = revenueIn(counted, thisMonth.minusMonths(1));
        Double change = revenueLast > 0 ? round((revenueThis - revenueLast) * 100 / revenueLast) : null;
        long ordersThisMonth = counted.stream().filter(o -> thisMonth.equals(monthOf(o))).count();
        long toShip = all.stream().filter(o -> o.getOrderStatus() == OrderStatus.PENDING
                || o.getOrderStatus() == OrderStatus.CONFIRMED || o.getOrderStatus() == OrderStatus.PACKED).count();

        Kpis kpis = new Kpis(round(revenue), counted.size(), counted.isEmpty() ? 0 : round(revenue / counted.size()),
                round(revenueThis), round(revenueLast), change, ordersThisMonth, toShip, lowStock.size());

        return new AnalyticsDto(kpis, monthly, bestSellers(counted), lowStock.stream().limit(10).toList(),
                customers(counted, thisMonth));
    }

    static List<MonthPoint> monthly(List<Order> orders, YearMonth end, int months) {
        Map<YearMonth, List<Order>> byMonth = orders.stream()
                .filter(o -> o.getOrderDate() != null)
                .collect(Collectors.groupingBy(AdminAnalyticsService::monthOf));
        List<MonthPoint> points = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth month = end.minusMonths(i);
            List<Order> inMonth = byMonth.getOrDefault(month, List.of());
            points.add(new MonthPoint(month.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + month.getYear(),
                    round(inMonth.stream().mapToDouble(o -> nz(o.getTotalAmount())).sum()), inMonth.size()));
        }
        return points;
    }

    static List<BestSeller> bestSellers(List<Order> orders) {
        Map<UUID, long[]> units = new LinkedHashMap<>();
        Map<UUID, double[]> revenue = new HashMap<>();
        Map<UUID, Product> products = new HashMap<>();
        for (Order order : orders) {
            if (order.getOrderItemList() == null) continue;
            for (OrderItem item : order.getOrderItemList()) {
                Product product = item.getProduct();
                if (product == null || product.getId() == null) continue;
                int qty = item.getQuantity() == null ? 0 : item.getQuantity();
                double price = item.getItemPrice() != null ? item.getItemPrice()
                        : product.getPrice() != null ? product.getPrice().doubleValue() : 0;
                products.putIfAbsent(product.getId(), product);
                units.computeIfAbsent(product.getId(), k -> new long[1])[0] += qty;
                revenue.computeIfAbsent(product.getId(), k -> new double[1])[0] += price * qty;
            }
        }
        return units.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> {
                    Product p = products.get(e.getKey());
                    return new BestSeller(p.getId(), p.getName(), thumbnail(p), e.getValue()[0],
                            round(revenue.get(e.getKey())[0]));
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

    private CustomerStats customers(List<Order> orders, YearMonth thisMonth) {
        Map<UUID, List<Order>> byCustomer = orders.stream()
                .filter(o -> o.getUser() != null)
                .collect(Collectors.groupingBy(o -> o.getUser().getId()));
        long repeat = byCustomer.values().stream().filter(list -> list.size() > 1).count();

        List<TopCustomer> top = byCustomer.values().stream()
                .map(list -> {
                    User user = list.get(0).getUser();
                    String name = String.join(" ", Optional.ofNullable(user.getFirstName()).orElse(""),
                            Optional.ofNullable(user.getLastName()).orElse("")).trim();
                    return new TopCustomer(name.isEmpty() ? user.getEmail() : name, user.getEmail(), list.size(),
                            round(list.stream().mapToDouble(o -> nz(o.getTotalAmount())).sum()));
                })
                .sorted(Comparator.comparingDouble(TopCustomer::spent).reversed())
                .limit(5)
                .toList();

        Date monthStart = Date.from(thisMonth.atDay(1).atStartOfDay(STORE_ZONE).toInstant());
        return new CustomerStats(userRepository.count(), userRepository.countByCreatedOnGreaterThanEqual(monthStart),
                byCustomer.size(), repeat, top);
    }

    private static double revenueIn(List<Order> orders, YearMonth month) {
        return orders.stream().filter(o -> month.equals(monthOf(o))).mapToDouble(o -> nz(o.getTotalAmount())).sum();
    }

    static YearMonth monthOf(Order order) {
        if (order.getOrderDate() == null) return null;
        LocalDate date = order.getOrderDate().toInstant().atZone(STORE_ZONE).toLocalDate();
        return YearMonth.from(date);
    }

    private static String thumbnail(Product product) {
        if (product.getResources() == null) return null;
        return product.getResources().stream().filter(r -> Boolean.TRUE.equals(r.getIsPrimary()))
                .map(Resources::getUrl).findFirst().orElse(null);
    }

    private static double nz(Double value) {
        return value == null ? 0 : value;
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
