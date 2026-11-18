package com.shopverse.services;

import com.shopverse.entities.Order;
import com.shopverse.entities.OrderItem;
import com.shopverse.entities.Product;
import com.shopverse.repositories.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Keeps variant stock in step with orders: taken when ordered, returned when cancelled.
 *
 * <p>Every change is a single conditional {@code UPDATE} in the database instead of
 * reading the stock, checking it in Java and writing it back. With read-check-write,
 * two customers ordering the last unit at the same moment would both see "1 left" and
 * both succeed. Here the database checks and updates the row together, so exactly one
 * of them gets it. Call these inside the order's transaction: if anything later fails,
 * the stock change rolls back with it.
 */
@Service
public class StockService {

    private final ProductVariantRepository variantRepository;

    public StockService(ProductVariantRepository variantRepository) {
        this.variantRepository = variantRepository;
    }

    /** Takes {@code quantity} units, or fails with 409 if they're no longer available. */
    public void take(Product product, UUID variantId, int quantity) {
        if (variantRepository.decrementStock(variantId, quantity) == 0) {
            String name = product == null ? "this product" : product.getName();
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Not enough stock left for " + name + ". Someone may have just bought the last one.");
        }
    }

    /** Puts every item of the order back into stock. */
    public void restore(Order order) {
        if (order.getOrderItemList() == null) {
            return;
        }
        for (OrderItem item : order.getOrderItemList()) {
            if (item.getProductVariantId() != null && item.getQuantity() != null) {
                variantRepository.incrementStock(item.getProductVariantId(), item.getQuantity());
            }
        }
    }
}
