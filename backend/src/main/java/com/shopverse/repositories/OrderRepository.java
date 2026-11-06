package com.shopverse.repositories;

import com.shopverse.auth.entities.User;
import com.shopverse.entities.Order;
import com.shopverse.entities.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUser(User user);

    Page<Order> findByOrderStatus(OrderStatus status, Pageable pageable);

    long countByOrderStatus(OrderStatus status);

    /** Total value of all orders that weren't cancelled. */
    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED")
    Double sumRevenue();
}
