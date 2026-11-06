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
    void ordersMoveForward() {
        assertTrue(OrderStatusRules.canChange(PENDING, IN_PROGRESS));
        assertTrue(OrderStatusRules.canChange(IN_PROGRESS, SHIPPED));
        assertTrue(OrderStatusRules.canChange(SHIPPED, DELIVERED));
    }

    @Test
    void cannotGoBackwardsOrSkipToDelivered() {
        assertFalse(OrderStatusRules.canChange(SHIPPED, PENDING));
        assertFalse(OrderStatusRules.canChange(PENDING, DELIVERED));
    }

    @Test
    void cancelOnlyBeforeShipping() {
        assertTrue(OrderStatusRules.canChange(PENDING, CANCELLED));
        assertTrue(OrderStatusRules.canChange(IN_PROGRESS, CANCELLED));
        assertFalse(OrderStatusRules.canChange(SHIPPED, CANCELLED));
        assertTrue(OrderStatusRules.customerCanCancel(PENDING));
        assertFalse(OrderStatusRules.customerCanCancel(SHIPPED));
        assertFalse(OrderStatusRules.customerCanCancel(DELIVERED));
    }

    @Test
    void finalStatusesHaveNoNextStep() {
        assertTrue(OrderStatusRules.nextStatuses(DELIVERED).isEmpty());
        assertTrue(OrderStatusRules.nextStatuses(CANCELLED).isEmpty());
        assertFalse(OrderStatusRules.canChange(CANCELLED, PENDING));
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
