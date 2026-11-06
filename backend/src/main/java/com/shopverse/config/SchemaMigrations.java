package com.shopverse.config;

import com.shopverse.entities.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Small data/schema fixes that Hibernate's automatic schema update can't do on
 * an existing database. Each step is safe to run on every start.
 */
@Component
@Order(0)
public class SchemaMigrations implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrations.class);

    private final JdbcTemplate jdbc;

    public SchemaMigrations(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        updateOrderStatusConstraint();
    }

    /**
     * Order statuses grew from 5 to 7 (CONFIRMED, PACKED, OUT_FOR_DELIVERY added,
     * IN_PROGRESS renamed to CONFIRMED). Hibernate created a CHECK constraint with
     * the old list, so it is replaced here and old rows are renamed.
     */
    private void updateOrderStatusConstraint() {
        String allowed = Arrays.stream(OrderStatus.values())
                .map(s -> "'" + s.name() + "'").collect(Collectors.joining(","));
        jdbc.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check");
        int renamed = jdbc.update("UPDATE orders SET order_status = 'CONFIRMED' WHERE order_status = 'IN_PROGRESS'");
        jdbc.execute("ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN (" + allowed + "))");
        if (renamed > 0) {
            log.info("Renamed {} IN_PROGRESS orders to CONFIRMED", renamed);
        }
    }
}
