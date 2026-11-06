package com.shopverse.services;

import com.shopverse.entities.OrderStatus;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Which order status changes are allowed.
 * Orders move forward PENDING -> CONFIRMED -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
 * (an admin may skip ahead) and can be cancelled only before they ship.
 * DELIVERED and CANCELLED are final.
 */
public final class OrderStatusRules {

    /** The delivery steps in order. */
    public static final List<OrderStatus> STEPS = List.of(
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKED,
            OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);

    private static final Set<OrderStatus> CANCELLABLE =
            EnumSet.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKED);

    private OrderStatusRules() {
    }

    public static boolean isFinal(OrderStatus status) {
        return status == OrderStatus.DELIVERED || status == OrderStatus.CANCELLED;
    }

    public static boolean canChange(OrderStatus from, OrderStatus to) {
        if (from == null || to == null) {
            return false;
        }
        if (from == to) {
            return true;
        }
        if (isFinal(from)) {
            return false;
        }
        if (to == OrderStatus.CANCELLED) {
            return CANCELLABLE.contains(from);
        }
        return STEPS.indexOf(to) > STEPS.indexOf(from);
    }

    /** Statuses the order can move to next (not including the current one). */
    public static Set<OrderStatus> nextStatuses(OrderStatus from) {
        Set<OrderStatus> next = EnumSet.noneOf(OrderStatus.class);
        if (from == null) {
            return next;
        }
        for (OrderStatus candidate : OrderStatus.values()) {
            if (candidate != from && canChange(from, candidate)) {
                next.add(candidate);
            }
        }
        return next;
    }

    /** Customers may cancel only before the order is shipped. */
    public static boolean customerCanCancel(OrderStatus status) {
        return CANCELLABLE.contains(status);
    }

    /** Orders still on their way to the customer. */
    public static boolean isActive(OrderStatus status) {
        return status != null && !isFinal(status);
    }
}
