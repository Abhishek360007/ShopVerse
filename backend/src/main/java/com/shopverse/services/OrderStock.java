package com.shopverse.services;

import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;

import java.util.Optional;
import java.util.UUID;

/**
 * Finds the variant (size / colour) an order line refers to. Stock itself is changed only
 * through {@link StockService}, with atomic database updates.
 */
public final class OrderStock {

    private OrderStock() {
    }

    public static Optional<ProductVariant> variantOf(Product product, UUID variantId) {
        if (product == null || product.getProductVariants() == null || variantId == null) {
            return Optional.empty();
        }
        return product.getProductVariants().stream().filter(v -> variantId.equals(v.getId())).findFirst();
    }
}
