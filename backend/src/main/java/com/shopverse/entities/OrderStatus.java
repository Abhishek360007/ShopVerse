package com.shopverse.entities;

/** Order lifecycle, in the order a delivery normally moves through it. */
public enum OrderStatus {
    PENDING,            // order placed
    CONFIRMED,          // payment received / order accepted
    PACKED,
    SHIPPED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}
