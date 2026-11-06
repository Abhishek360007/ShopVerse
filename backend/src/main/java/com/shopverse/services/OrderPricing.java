package com.shopverse.services;

import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Prices order lines on the server from the catalog, so the amount charged
 * never depends on what the browser sends.
 */
public final class OrderPricing {

    public static final int MAX_QUANTITY_PER_LINE = 10;

    private OrderPricing() {
    }

    /**
     * Validates one order line and returns its total (price x quantity).
     *
     * @throws IllegalArgumentException if the variant doesn't belong to the product,
     *                                  the quantity is invalid, or there isn't enough stock
     */
    public static BigDecimal lineTotal(Product product, UUID variantId, Integer quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }
        if (quantity == null || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
            throw new IllegalArgumentException("Invalid quantity for " + product.getName());
        }
        ProductVariant variant = product.getProductVariants() == null ? null :
                product.getProductVariants().stream()
                        .filter(v -> v.getId() != null && v.getId().equals(variantId))
                        .findFirst()
                        .orElse(null);
        if (variant == null) {
            throw new IllegalArgumentException("Selected option is not available for " + product.getName());
        }
        if (variant.getStockQuantity() == null || variant.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Not enough stock for " + product.getName());
        }
        return product.getPrice().multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }
}
