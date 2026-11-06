package com.shopverse.services;

import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.OrderStatus;
import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static com.shopverse.entities.OrderStatus.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderStatusRulesTest {

    @Test
    void ordersMoveForwardThroughEveryStep() {
        assertTrue(OrderStatusRules.canChange(PENDING, CONFIRMED));
        assertTrue(OrderStatusRules.canChange(CONFIRMED, PACKED));
        assertTrue(OrderStatusRules.canChange(PACKED, SHIPPED));
        assertTrue(OrderStatusRules.canChange(SHIPPED, OUT_FOR_DELIVERY));
        assertTrue(OrderStatusRules.canChange(OUT_FOR_DELIVERY, DELIVERED));
    }

    @Test
    void adminMaySkipAheadButNotGoBack() {
        assertTrue(OrderStatusRules.canChange(PENDING, SHIPPED));
        assertFalse(OrderStatusRules.canChange(SHIPPED, PACKED));
        assertFalse(OrderStatusRules.canChange(OUT_FOR_DELIVERY, PENDING));
    }

    @Test
    void cancelOnlyBeforeShipping() {
        assertTrue(OrderStatusRules.canChange(PACKED, CANCELLED));
        assertFalse(OrderStatusRules.canChange(SHIPPED, CANCELLED));
        assertFalse(OrderStatusRules.canChange(OUT_FOR_DELIVERY, CANCELLED));
        assertTrue(OrderStatusRules.customerCanCancel(CONFIRMED));
        assertFalse(OrderStatusRules.customerCanCancel(SHIPPED));
    }

    @Test
    void finalStatusesHaveNoNextStep() {
        assertTrue(OrderStatusRules.nextStatuses(DELIVERED).isEmpty());
        assertTrue(OrderStatusRules.nextStatuses(CANCELLED).isEmpty());
        assertFalse(OrderStatusRules.canChange(CANCELLED, PENDING));
    }

    @Test
    void nextStatusesFromShipped() {
        assertEquals(java.util.EnumSet.of(OUT_FOR_DELIVERY, DELIVERED), OrderStatusRules.nextStatuses(SHIPPED));
    }

    @Test
    void changeStatusRecordsHistory() {
        Order order = Order.builder().orderStatus(PENDING).build();
        order.changeStatus(CONFIRMED, "Payment received");
        order.changeStatus(PACKED, null);
        assertEquals(PACKED, order.getOrderStatus());
        assertEquals(List.of(CONFIRMED, PACKED), order.getStatusHistory().stream().map(e -> e.getStatus()).toList());
        assertNotNull(order.getStatusHistory().get(0).getCreatedAt());
    }

    @Test
    void stockIsTakenAndRestored() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder().id(variantId).stockQuantity(10).build();
        Product product = Product.builder().productVariants(List.of(variant)).build();

        OrderStock.take(product, variantId, 3);
        assertEquals(7, variant.getStockQuantity());

        Order order = Order.builder().orderStatus(OrderStatus.CANCELLED)
                .orderItemList(List.of(OrderItem.builder().product(product).productVariantId(variantId).quantity(3).build()))
                .build();
        OrderStock.restore(order);
        assertEquals(10, variant.getStockQuantity());
    }
}
