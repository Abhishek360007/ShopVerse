package com.shopverse.services;

import com.shopverse.entities.OrderStatus;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Which order status changes are allowed.
 * Orders move forward PENDING -> IN_PROGRESS -> SHIPPED -> DELIVERED and can be
 * cancelled only before they ship. DELIVERED and CANCELLED are final.
 */
public final class OrderStatusRules {

    private static final Map<OrderStatus, Set<OrderStatus>> NEXT = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.IN_PROGRESS, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.IN_PROGRESS, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class)
    );

    private OrderStatusRules() {
    }

    public static boolean canChange(OrderStatus from, OrderStatus to) {
        if (from == null || to == null) {
            return false;
        }
        return from == to || NEXT.get(from).contains(to);
    }

    /** Statuses the order can move to next (not including the current one). */
    public static Set<OrderStatus> nextStatuses(OrderStatus from) {
        return from == null ? EnumSet.noneOf(OrderStatus.class) : EnumSet.copyOf((EnumSet<OrderStatus>) NEXT.get(from));
    }

    /** Customers may cancel only before the order is shipped. */
    public static boolean customerCanCancel(OrderStatus status) {
        return status == OrderStatus.PENDING || status == OrderStatus.IN_PROGRESS;
    }
}
