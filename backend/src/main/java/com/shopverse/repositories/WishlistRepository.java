package com.shopverse.repositories;

import com.shopverse.auth.entities.User;
import com.shopverse.entities.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WishlistRepository extends JpaRepository<WishlistItem, UUID> {

    List<WishlistItem> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByUserAndProduct_Id(User user, UUID productId);

    long deleteByUserAndProduct_Id(User user, UUID productId);
}
