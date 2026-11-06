package com.shopverse.repositories;

import com.shopverse.entities.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    /** Options that are running low, lowest stock first. */
    List<ProductVariant> findByStockQuantityLessThanEqualOrderByStockQuantityAsc(Integer threshold);
}
