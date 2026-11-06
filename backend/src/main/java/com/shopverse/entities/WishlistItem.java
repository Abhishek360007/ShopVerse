package com.shopverse.entities;

import com.shopverse.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.UUID;

/** A product a customer saved for later. Each product appears at most once per customer. */
@Entity
@Table(name = "wishlist_items",
        uniqueConstraints = @UniqueConstraint(name = "uk_wishlist_user_product", columnNames = {"user_id", "product_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItem {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    private Product product;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = new Date();
        }
    }
}
