package com.shopverse.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.shopverse.auth.entities.User;
import com.shopverse.dto.AdminOrderDto;
import com.shopverse.dto.AdminOrderItemDto;
import com.shopverse.dto.OrderStatsDto;
import com.shopverse.dto.StatusEventDto;
import com.shopverse.entities.Address;
import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Payment;
import com.shopverse.entities.PaymentStatus;
import com.shopverse.entities.Product;
import com.shopverse.entities.Resources;
import com.shopverse.repositories.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Order management for the store admin. */
@Service
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final StockService stockService;

    public AdminOrderService(OrderRepository orderRepository, StockService stockService) {
        this.orderRepository = orderRepository;
        this.stockService = stockService;
    }

    @Transactional(readOnly = true)
    public Page<AdminOrderDto> list(OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "orderDate"));
        Page<Order> orders = status == null
                ? orderRepository.findAll(pageable)
                : orderRepository.findByOrderStatus(status, pageable);
        return orders.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public AdminOrderDto get(UUID id) {
        return toDto(find(id));
    }

    @Transactional
    public AdminOrderDto updateStatus(UUID id, OrderStatus newStatus, String note, String trackingNumber) {
        if (newStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an order status");
        }
        // Row lock: a status change can move stock (cancel) or money (COD delivered), so two
        // changes to one order, or an admin cancel racing the customer's cancel, run one at a time.
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        OrderStatus current = order.getOrderStatus();
        if (!OrderStatusRules.canChange(current, newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An order that is " + label(current) + " can't be changed to " + label(newStatus));
        }
        if (trackingNumber != null) {
            order.setShipmentTrackingNumber(trackingNumber.isBlank() ? null : trackingNumber.trim());
        }
        if (current != newStatus) {
            order.changeStatus(newStatus, note == null || note.isBlank() ? null : note.trim());
            Payment payment = order.getPayment();
            if (newStatus == OrderStatus.CANCELLED) {
                stockService.restore(order);
            }
            // Cash on delivery is paid when the order is handed over
            if (newStatus == OrderStatus.DELIVERED && payment != null && "COD".equals(order.getPaymentMethod())) {
                payment.setPaymentStatus(PaymentStatus.COMPLETED);
            }
            orderRepository.save(order);
        }
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public OrderStatsDto stats() {
        long total = orderRepository.count();
        long cancelled = orderRepository.countByOrderStatus(OrderStatus.CANCELLED);
        BigDecimal revenue = Objects.requireNonNullElse(orderRepository.sumRevenue(), BigDecimal.ZERO);
        long counted = total - cancelled;
        return OrderStatsDto.builder()
                .totalOrders(total)
                .toShip(orderRepository.countByOrderStatus(OrderStatus.PENDING)
                        + orderRepository.countByOrderStatus(OrderStatus.CONFIRMED)
                        + orderRepository.countByOrderStatus(OrderStatus.PACKED))
                .shipped(orderRepository.countByOrderStatus(OrderStatus.SHIPPED)
                        + orderRepository.countByOrderStatus(OrderStatus.OUT_FOR_DELIVERY))
                .delivered(orderRepository.countByOrderStatus(OrderStatus.DELIVERED))
                .cancelled(cancelled)
                .revenue(money(revenue))
                .averageOrderValue(counted > 0 ? money(revenue.divide(BigDecimal.valueOf(counted), 2, RoundingMode.HALF_UP)) : 0)
                .build();
    }

    private Order find(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private AdminOrderDto toDto(Order order) {
        User user = order.getUser();
        Address address = order.getAddress();
        List<OrderItem> items = order.getOrderItemList() == null ? List.of() : order.getOrderItemList();
        Payment payment = order.getPayment();

        return AdminOrderDto.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .orderStatus(order.getOrderStatus())
                .nextStatuses(OrderStatusRules.nextStatuses(order.getOrderStatus()))
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(payment != null ? payment.getPaymentStatus() : null)
                .totalAmount(order.getTotalAmount())
                .itemCount(items.stream().mapToInt(i -> i.getQuantity() == null ? 0 : i.getQuantity()).sum())
                .customerName(user == null ? null : joinNonBlank(" ", user.getFirstName(), user.getLastName()))
                .customerEmail(user == null ? null : user.getEmail())
                .phoneNumber(address != null && address.getPhoneNumber() != null ? address.getPhoneNumber()
                        : user == null ? null : user.getPhoneNumber())
                .shippingAddress(address == null ? null : joinNonBlank(", ", address.getName(), address.getStreet(),
                        address.getCity(), address.getState(), address.getZipCode()))
                .items(items.stream().map(this::toItemDto).toList())
                .trackingNumber(order.getShipmentTrackingNumber())
                .statusHistory(StatusEventDto.historyOf(order.getStatusHistory(), order.getOrderDate(), order.getOrderStatus()))
                .build();
    }

    private AdminOrderItemDto toItemDto(OrderItem item) {
        Product product = item.getProduct();
        BigDecimal unitPrice = item.getItemPrice() != null ? item.getItemPrice()
                : product != null && product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
        var variant = OrderStock.variantOf(product, item.getProductVariantId());
        return AdminOrderItemDto.builder()
                .productName(product == null ? "Removed product" : product.getName())
                .thumbnail(product == null || product.getResources() == null ? null : product.getResources().stream()
                        .filter(r -> Boolean.TRUE.equals(r.getIsPrimary())).map(Resources::getUrl).findFirst()
                        .orElse(null))
                .size(variant.map(v -> v.getSize()).orElse(null))
                .color(variant.map(v -> v.getColor()).orElse(null))
                .quantity(quantity)
                .unitPrice(unitPrice)
                .lineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    private static String joinNonBlank(String separator, String... parts) {
        return Stream.of(parts).filter(p -> p != null && !p.isBlank()).collect(Collectors.joining(separator));
    }

    private static String label(OrderStatus status) {
        return status == null ? "unknown" : status.name().replace('_', ' ').toLowerCase();
    }

    /** Money to two decimals, as a plain number for the dashboard summary. */
    private static double money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
