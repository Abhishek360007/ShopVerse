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
        moneyColumnsToNumeric();
    }

    /** Money columns that used to be Double (floating point) and are now BigDecimal. */
    private static final String[][] MONEY_COLUMNS = {
            {"orders", "total_amount"}, {"orders", "discount"}, {"order_items", "item_price"}, {"payment", "amount"}};

    /**
     * Money used to be stored as {@code double precision}, which can't hold most decimal
     * amounts exactly (0.1 + 0.2 != 0.3). The entities now use {@code BigDecimal}; Hibernate
     * creates {@code NUMERIC(12,2)} on a new database but never changes an existing column's
     * type, so existing databases are converted here, once, rounding to paise. A failure is
     * logged rather than stopping the app: reading a double column into BigDecimal still works.
     */
    private void moneyColumnsToNumeric() {
        for (String[] column : MONEY_COLUMNS) {
            String table = column[0];
            String name = column[1];
            try {
                String type = jdbc.query(
                        "SELECT data_type FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                        rs -> rs.next() ? rs.getString(1) : null, table, name);
                if (type != null && type.toLowerCase().startsWith("double")) {
                    jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + name
                            + " TYPE NUMERIC(12,2) USING ROUND(" + name + "::numeric, 2)");
                    log.info("Converted {}.{} from {} to NUMERIC(12,2)", table, name, type);
                }
            } catch (RuntimeException e) {
                log.warn("Could not convert {}.{} to NUMERIC(12,2): {}", table, name, e.getMessage());
            }
        }
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
