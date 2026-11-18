package com.shopverse.repositories;

import com.shopverse.auth.entities.User;
import com.shopverse.auth.repositories.UserDetailRepository;
import com.shopverse.entities.*;
import com.shopverse.services.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs the stock updates and the analytics queries against a real (in-memory H2) database,
 * so a JPQL mistake fails the build instead of the app's startup.
 */
@DataJpaTest(properties = {
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class StockAndOrderQueriesTest {

    @Autowired TestEntityManager em;
    @Autowired ProductVariantRepository variants;
    @Autowired OrderRepository orders;
    @Autowired UserDetailRepository users;

    private Category category;
    private CategoryType categoryType;
    private int slugs;

    @BeforeEach
    void catalog() {
        category = em.persist(Category.builder().name("Books").code("BOOKS").description("Books").build());
        categoryType = em.persist(CategoryType.builder().name("Fiction").code("FICTION").description("Fiction")
                .category(category).build());
    }

    // ---------------------------------------------------------------- stock

    @Test
    void theLastUnitCanBeTakenOnlyOnce() {
        ProductVariant variant = variant(product("Mug", "299.00"), 1);

        assertEquals(1, variants.decrementStock(variant.getId(), 1));
        assertEquals(0, variants.decrementStock(variant.getId(), 1)); // a second order finds nothing left

        assertEquals(0, stockOf(variant));
    }

    @Test
    void neverTakesMoreThanIsLeftAndNeverGoesNegative() {
        ProductVariant variant = variant(product("Mug", "299.00"), 2);

        assertEquals(0, variants.decrementStock(variant.getId(), 3));

        assertEquals(2, stockOf(variant));
    }

    @Test
    void stockServiceRefusesASoldOutItemWith409AndRestoresCancelledOrders() {
        Product mug = product("Mug", "299.00");
        ProductVariant variant = variant(mug, 1);
        StockService stock = new StockService(variants);

        stock.take(mug, variant.getId(), 1);
        ResponseStatusException soldOut = assertThrows(ResponseStatusException.class,
                () -> stock.take(mug, variant.getId(), 1));
        assertEquals(HttpStatus.CONFLICT, soldOut.getStatusCode());

        Order cancelled = Order.builder().orderItemList(List.of(
                OrderItem.builder().product(mug).productVariantId(variant.getId()).quantity(1).build())).build();
        stock.restore(cancelled);
        assertEquals(1, stockOf(variant));
    }

    // ---------------------------------------------------------------- orders

    @Test
    void lockingFinderLoadsTheOrder() {
        User alice = user("alice@example.com");
        Order order = order(alice, "100.00", OrderStatus.PENDING);

        assertEquals(order.getId(), orders.findByIdForUpdate(order.getId()).orElseThrow().getId());
    }

    @Test
    void analyticsAreAggregatedInTheDatabaseWithExactMoney() {
        User alice = user("alice@example.com");
        User bob = user("bob@example.com");
        Product mug = product("Mug", "299.00");
        Product book = product("Book", "0.10");

        order(alice, "0.10", OrderStatus.DELIVERED, item(book, 1, "0.10"));
        order(alice, "0.20", OrderStatus.SHIPPED, item(mug, 3, null));       // no price paid recorded: catalog price
        order(bob, "50.00", OrderStatus.PENDING, item(book, 1, "0.10"));
        order(bob, "999.00", OrderStatus.CANCELLED, item(mug, 10, "299.00")); // cancelled: never counted
        em.flush();
        em.clear();

        assertEquals(0, new BigDecimal("50.30").compareTo(orders.sumRevenue())); // 0.1 + 0.2 is exact
        assertEquals(3, orders.countNotCancelled());
        assertEquals(2, orders.countByOrderStatusIn(List.of(OrderStatus.PENDING, OrderStatus.SHIPPED)));
        assertEquals(2, orders.countPayingCustomers());
        assertEquals(1, orders.repeatCustomerIds().size());  // alice
        assertEquals(3, orders.datedTotalsSince(new Date(0)).size());

        List<Object[]> best = orders.bestSellers(PageRequest.of(0, 5));
        assertEquals(mug.getId(), best.get(0)[0]);            // mug 3 units beats book 2 (the cancelled 10 don't count)
        assertEquals(3L, ((Number) best.get(0)[1]).longValue());
        assertEquals(0, new BigDecimal("897.00").compareTo(new BigDecimal(best.get(0)[2].toString())));
        assertEquals(book.getId(), best.get(1)[0]);
        assertEquals(0, new BigDecimal("0.20").compareTo(new BigDecimal(best.get(1)[2].toString())));

        List<Object[]> top = orders.topCustomers(PageRequest.of(0, 5));
        assertEquals(bob.getId(), top.get(0)[0]);             // 50.00 beats 0.30
        assertEquals(2L, ((Number) top.get(1)[1]).longValue());

        assertEquals(2, users.findByIdIn(List.of(alice.getId(), bob.getId())).size());
    }

    // ---------------------------------------------------------------- fixtures

    private Product product(String name, String price) {
        Date now = new Date();
        return em.persist(Product.builder().name(name).price(new BigDecimal(price)).brand("ShopVerse")
                .isNewArrival(false).slug(name.toLowerCase() + "-" + (++slugs)).createdAt(now).updatedAt(now)
                .category(category).categoryType(categoryType).build());
    }

    private ProductVariant variant(Product product, int stock) {
        ProductVariant variant = em.persist(ProductVariant.builder().color("Blue").size("M").stockQuantity(stock)
                .product(product).build());
        em.flush();
        return variant;
    }

    private int stockOf(ProductVariant variant) {
        em.clear(); // the update ran in the database; read the row again
        return variants.findById(variant.getId()).orElseThrow().getStockQuantity();
    }

    private User user(String email) {
        return em.persist(User.builder().email(email).firstName(email.substring(0, email.indexOf('@')))
                .createdOn(new Date()).build());
    }

    private static OrderItem item(Product product, int quantity, String pricePaid) {
        return OrderItem.builder().product(product).quantity(quantity)
                .itemPrice(pricePaid == null ? null : new BigDecimal(pricePaid)).build();
    }

    private Order order(User user, String total, OrderStatus status, OrderItem... items) {
        Address address = em.persist(Address.builder().name("Home").street("1 MG Road").city("Pune").state("MH")
                .zipCode("411001").phoneNumber("9999999999").user(user).build());
        Order order = Order.builder().user(user).address(address).totalAmount(new BigDecimal(total))
                .orderStatus(status).paymentMethod("COD").orderDate(new Date()).build();
        for (OrderItem item : items) {
            item.setOrder(order);
        }
        order.setOrderItemList(List.of(items));
        return em.persist(order);
    }
}
