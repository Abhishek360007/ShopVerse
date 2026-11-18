package com.shopverse.repositories;

import com.shopverse.auth.entities.User;
import com.shopverse.entities.Order;
import com.shopverse.entities.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUser(User user);

    Page<Order> findByOrderStatus(OrderStatus status, Pageable pageable);

    long countByOrderStatus(OrderStatus status);

    long countByOrderStatusIn(Collection<OrderStatus> statuses);

    /**
     * The order with a row lock ({@code SELECT ... FOR UPDATE}) held until the transaction
     * ends. Status changes that move stock or money (cancel, payment) take this lock, so
     * two of them can't run on the same order at once (e.g. a double cancel restoring
     * stock twice, or the payment callback racing the Stripe webhook).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") UUID id);

    /** Total value of all orders that weren't cancelled. */
    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED")
    BigDecimal sumRevenue();

    // ---------- Admin analytics: aggregated in the database, not in memory ----------

    /** Number of orders that weren't cancelled. */
    @Query("select count(o) from Order o where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED")
    long countNotCancelled();

    /**
     * Date and total of every non-cancelled order since {@code since}: just the window the
     * monthly chart needs, two columns per order, grouped by month in the store's time zone.
     */
    @Query("select o.orderDate, o.totalAmount from Order o "
            + "where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED and o.orderDate >= :since")
    List<Object[]> datedTotalsSince(@Param("since") Date since);

    /**
     * Best sellers: product id, units sold and revenue (price paid, or the catalog price
     * for old lines without one), most units first. Use a {@code Pageable} to take the top N.
     */
    @Query("select p.id, sum(i.quantity), sum(coalesce(i.itemPrice, p.price) * i.quantity) "
            + "from OrderItem i join i.product p join i.order o "
            + "where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED "
            + "group by p.id order by sum(i.quantity) desc")
    List<Object[]> bestSellers(Pageable pageable);

    /** Top customers: user id, number of orders and amount spent, biggest spenders first. */
    @Query("select u.id, count(o), sum(o.totalAmount) from Order o join o.user u "
            + "where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED "
            + "group by u.id order by sum(o.totalAmount) desc")
    List<Object[]> topCustomers(Pageable pageable);

    /** Customers with at least one non-cancelled order. */
    @Query("select count(distinct o.user.id) from Order o where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED")
    long countPayingCustomers();

    /** One row per customer with more than one non-cancelled order (its size is the count). */
    @Query("select o.user.id from Order o where o.orderStatus <> com.shopverse.entities.OrderStatus.CANCELLED "
            + "group by o.user.id having count(o) > 1")
    List<UUID> repeatCustomerIds();
}
