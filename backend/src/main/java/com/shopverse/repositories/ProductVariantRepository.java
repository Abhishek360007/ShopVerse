package com.shopverse.repositories;

import com.shopverse.entities.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    /** Options that are running low, lowest stock first. */
    List<ProductVariant> findByStockQuantityLessThanEqualOrderByStockQuantityAsc(Integer threshold);

    /**
     * Takes {@code quantity} units in one atomic statement, only if that many are left.
     * Returns 1 when the stock was taken and 0 when there wasn't enough. The database
     * checks and updates the row together, so two orders for the last unit can't both
     * succeed (a read-check-write in Java could let both through).
     */
    @Modifying(flushAutomatically = true)
    @Query("update ProductVariant v set v.stockQuantity = v.stockQuantity - :quantity "
            + "where v.id = :id and v.stockQuantity >= :quantity")
    int decrementStock(@Param("id") UUID id, @Param("quantity") int quantity);

    /** Puts {@code quantity} units back, in one atomic statement. */
    @Modifying(flushAutomatically = true)
    @Query("update ProductVariant v set v.stockQuantity = v.stockQuantity + :quantity where v.id = :id")
    int incrementStock(@Param("id") UUID id, @Param("quantity") int quantity);
}
