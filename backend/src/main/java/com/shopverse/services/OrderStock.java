package com.shopverse.services;

import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;

import java.util.Optional;
import java.util.UUID;

/** Keeps variant stock in step with orders: taken when ordered, returned when cancelled. */
public final class OrderStock {

    private OrderStock() {
    }

    public static Optional<ProductVariant> variantOf(Product product, UUID variantId) {
        if (product == null || product.getProductVariants() == null || variantId == null) {
            return Optional.empty();
        }
        return product.getProductVariants().stream().filter(v -> variantId.equals(v.getId())).findFirst();
    }

    public static void take(Product product, UUID variantId, int quantity) {
        variantOf(product, variantId).ifPresent(v -> v.setStockQuantity(Math.max(0, v.getStockQuantity() - quantity)));
    }

    /** Puts every item of the order back into stock. */
    public static void restore(Order order) {
        if (order.getOrderItemList() == null) {
            return;
        }
        for (OrderItem item : order.getOrderItemList()) {
            variantOf(item.getProduct(), item.getProductVariantId())
                    .ifPresent(v -> v.setStockQuantity(v.getStockQuantity() + item.getQuantity()));
        }
    }
}
