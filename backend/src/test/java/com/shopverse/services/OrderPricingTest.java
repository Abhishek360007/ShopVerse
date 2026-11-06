package com.shopverse.services;

import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderPricingTest {

    private Product product;
    private UUID variantId;

    @BeforeEach
    void setUp() {
        variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder().id(variantId).color("Navy").size("M").stockQuantity(3).build();
        product = Product.builder().name("Meridian Shirt").price(new BigDecimal("1299.00"))
                .productVariants(List.of(variant)).build();
    }

    @Test
    void usesCatalogPriceTimesQuantity() {
        assertEquals(new BigDecimal("2598.00"), OrderPricing.lineTotal(product, variantId, 2));
    }

    @Test
    void rejectsVariantFromAnotherProduct() {
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.lineTotal(product, UUID.randomUUID(), 1));
    }

    @Test
    void rejectsQuantityAboveStock() {
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.lineTotal(product, variantId, 4));
    }

    @Test
    void rejectsZeroOrMissingQuantity() {
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.lineTotal(product, variantId, 0));
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.lineTotal(product, variantId, null));
    }

    @Test
    void rejectsMissingProduct() {
        assertThrows(IllegalArgumentException.class, () -> OrderPricing.lineTotal(null, variantId, 1));
    }
}
