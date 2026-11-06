package com.shopverse.config;

import com.shopverse.auth.entities.Authority;
import com.shopverse.auth.entities.User;
import com.shopverse.auth.repositories.UserDetailRepository;
import com.shopverse.auth.services.AuthorityService;
import com.shopverse.entities.Category;
import com.shopverse.entities.CategoryType;
import com.shopverse.entities.Product;
import com.shopverse.entities.ProductVariant;
import com.shopverse.entities.Resources;
import com.shopverse.repositories.CategoryRepository;
import com.shopverse.repositories.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Prepares the database: creates the USER/ADMIN roles, promotes the configured
 * admin account, and adds the starter catalog in numbered batches.
 * Each batch is applied once (tracked in the seed_history table), so products
 * an admin deletes later don't come back on restart.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AuthorityService authorityService;
    private final UserDetailRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final JdbcTemplate jdbc;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.admin.email:}")
    private String adminEmail;

    public DataSeeder(AuthorityService authorityService, UserDetailRepository userRepository,
                      CategoryRepository categoryRepository, ProductRepository productRepository,
                      JdbcTemplate jdbc) {
        this.authorityService = authorityService;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.jdbc = jdbc;
    }

    // ---------------------------------------------------------------- catalog

    private record CategoryDef(String code, String name, String description) {
    }

    private record TypeDef(String category, String code, String name, String description) {
    }

    private record ProductDef(String category, String type, String name, String slug, String brand, String price,
                              float rating, boolean newArrival, String description, String image,
                              String color, int stock, String... sizes) {
    }

    private record Batch(int version, List<TypeDef> types, List<ProductDef> products) {
    }

    private static final List<CategoryDef> CATEGORIES = List.of(
            new CategoryDef("ELECTRONICS", "Electronics", "Headphones, gadgets and smart devices"),
            new CategoryDef("FASHION", "Fashion", "Everyday clothing and style essentials"),
            new CategoryDef("HOME_KITCHEN", "Home & Kitchen", "Cookware and essentials for every home"),
            new CategoryDef("BOOKS", "Books", "Bestsellers, fiction and more"),
            new CategoryDef("SPORTS", "Sports", "Gear for training, running and the outdoors"),
            new CategoryDef("BEAUTY", "Beauty", "Skincare and personal care"));

    private static final List<Batch> BATCHES = List.of(
            // Batch 1: launch catalog
            new Batch(1, List.of(
                    new TypeDef("ELECTRONICS", "AUDIO", "Audio", "Headphones, earbuds and speakers"),
                    new TypeDef("FASHION", "MENS_SHIRTS", "Men's Shirts", "Casual and formal shirts for men"),
                    new TypeDef("HOME_KITCHEN", "COOKWARE", "Cookware", "Pots, pans and cookware sets"),
                    new TypeDef("BOOKS", "FICTION", "Fiction", "Novels and short stories"),
                    new TypeDef("SPORTS", "RUNNING", "Running", "Running shoes and accessories"),
                    new TypeDef("BEAUTY", "SKINCARE", "Skincare", "Serums, moisturisers and cleansers")),
                    List.of(
                            new ProductDef("ELECTRONICS", "AUDIO", "Aurora Wireless Noise-Cancelling Headphones",
                                    "aurora-wireless-noise-cancelling-headphones", "Aurora", "4999.00", 4.6f, true,
                                    "Over-ear Bluetooth headphones with active noise cancellation, up to 30 hours of battery life "
                                            + "and soft memory-foam ear cushions. Folds flat into the included travel case.",
                                    "aurora-anc-headphones.jpg", "Black", 25, "One Size"),
                            new ProductDef("FASHION", "MENS_SHIRTS", "Meridian Men's Cotton Casual Shirt",
                                    "meridian-mens-cotton-casual-shirt", "Meridian", "1299.00", 4.4f, true,
                                    "A breathable 100% cotton shirt in deep navy with a regular fit, button-down front and a chest "
                                            + "pocket. Easy to dress up for work or down for the weekend.",
                                    "meridian-cotton-shirt.jpg", "Navy", 20, "S", "M", "L", "XL"),
                            new ProductDef("HOME_KITCHEN", "COOKWARE", "TerraCook 12-Piece Nonstick Cookware Set",
                                    "terracook-12-piece-nonstick-cookware-set", "TerraCook", "3499.00", 4.5f, false,
                                    "Granite-finish nonstick pots and pans with tempered glass lids. PFOA-free, dishwasher safe, "
                                            + "and works on gas and induction cooktops.",
                                    "terracook-cookware-set.jpg", "Black", 15, "12-Piece Set"),
                            new ProductDef("BOOKS", "FICTION", "The Quiet Library — Bestseller Novel",
                                    "the-quiet-library-bestseller-novel", "Inkwell Press", "999.00", 4.8f, true,
                                    "A quietly powerful story about a small-town librarian, a lost manuscript and the readers it "
                                            + "brings together. Paperback, 384 pages.",
                                    "quiet-library-novel.jpg", "Standard", 50, "Paperback"),
                            new ProductDef("SPORTS", "RUNNING", "Velocity Pro Running Shoes",
                                    "velocity-pro-running-shoes", "Velocity", "2799.00", 4.5f, false,
                                    "Lightweight running shoes with a breathable knit upper, responsive cushioning and a durable "
                                            + "rubber outsole built for daily road runs.",
                                    "velocity-pro-running-shoes.jpg", "Blue", 12, "UK 7", "UK 8", "UK 9", "UK 10"),
                            new ProductDef("BEAUTY", "SKINCARE", "Lumina Vitamin C Brightening Serum",
                                    "lumina-vitamin-c-brightening-serum", "Lumina", "899.00", 4.3f, false,
                                    "A lightweight vitamin C serum with hyaluronic acid that brightens dull skin and evens out "
                                            + "skin tone. Gentle enough for daily use. 30 ml.",
                                    "lumina-vitamin-c-serum.jpg", "Standard", 40, "30 ml"))),

            // Batch 2: two more products per category
            new Batch(2, List.of(
                    new TypeDef("ELECTRONICS", "WEARABLES", "Wearables", "Smartwatches and fitness trackers"),
                    new TypeDef("FASHION", "WOMENS_DRESSES", "Women's Dresses", "Dresses for every occasion"),
                    new TypeDef("FASHION", "JACKETS", "Jackets", "Denim, bomber and casual jackets"),
                    new TypeDef("HOME_KITCHEN", "COFFEE_TEA", "Coffee & Tea", "Brewers, carafes and serveware"),
                    new TypeDef("HOME_KITCHEN", "LIGHTING", "Lighting", "Desk, table and floor lamps"),
                    new TypeDef("BOOKS", "SELF_HELP", "Self-Help", "Habits, wellbeing and personal growth"),
                    new TypeDef("BOOKS", "STATIONERY", "Notebooks & Stationery", "Journals, notebooks and pens"),
                    new TypeDef("SPORTS", "YOGA_FITNESS", "Yoga & Fitness", "Mats and home workout gear"),
                    new TypeDef("SPORTS", "STRENGTH", "Strength Training", "Dumbbells, plates and weights"),
                    new TypeDef("BEAUTY", "FRAGRANCE", "Fragrance", "Perfumes and body mists")),
                    List.of(
                            new ProductDef("ELECTRONICS", "WEARABLES", "Pulse Fit Smartwatch",
                                    "pulse-fit-smartwatch", "Pulse", "3999.00", 4.4f, true,
                                    "A slim smartwatch with heart-rate and sleep tracking, step counting, call and message "
                                            + "alerts, and up to 7 days of battery life. Water resistant for workouts and showers.",
                                    "pulse-fit-smartwatch.jpg", "Rose Gold", 30, "One Size"),
                            new ProductDef("ELECTRONICS", "AUDIO", "Boom Mini Bluetooth Speaker",
                                    "boom-mini-bluetooth-speaker", "Boom", "1499.00", 4.2f, false,
                                    "A pocket-sized wireless speaker with surprisingly big sound, 10 hours of playtime, "
                                            + "a built-in mic for calls and a splash-resistant rubber finish.",
                                    "boom-mini-bluetooth-speaker.jpg", "Black", 40, "One Size"),
                            new ProductDef("FASHION", "WOMENS_DRESSES", "Bloom Floral Summer Dress",
                                    "bloom-floral-summer-dress", "Bloom", "1899.00", 4.5f, true,
                                    "A flowy, lightweight dress with a soft floral print, long balloon sleeves and a relaxed "
                                            + "fit. Made from breathable viscose for warm days.",
                                    "bloom-floral-summer-dress.jpg", "Lilac", 15, "S", "M", "L", "XL"),
                            new ProductDef("FASHION", "JACKETS", "Urban Denim Jacket",
                                    "urban-denim-jacket", "Urban Thread", "2499.00", 4.6f, false,
                                    "A classic mid-wash denim jacket with button chest pockets and a regular fit. Durable "
                                            + "cotton denim that softens with every wear.",
                                    "urban-denim-jacket.jpg", "Blue", 12, "S", "M", "L", "XL"),
                            new ProductDef("HOME_KITCHEN", "COFFEE_TEA", "Brewmaster Glass Coffee Carafe Set",
                                    "brewmaster-glass-coffee-carafe-set", "Brewmaster", "1299.00", 4.3f, false,
                                    "A heat-resistant borosilicate glass carafe with a matching milk jug, ideal for pour-over "
                                            + "coffee or tea. Holds 600 ml and is dishwasher safe.",
                                    "brewmaster-glass-coffee-carafe.jpg", "Standard", 25, "600 ml"),
                            new ProductDef("HOME_KITCHEN", "LIGHTING", "Lumen Adjustable Desk Lamp",
                                    "lumen-adjustable-desk-lamp", "Lumen", "1799.00", 4.4f, true,
                                    "A matte-black metal desk lamp with an adjustable arm and tilting shade for focused "
                                            + "reading light. Works with standard E27 LED bulbs.",
                                    "lumen-adjustable-desk-lamp.jpg", "Black", 20, "One Size"),
                            new ProductDef("BOOKS", "SELF_HELP", "Mindful Mornings — Self-Help Guide",
                                    "mindful-mornings-self-help-guide", "Inkwell Press", "499.00", 4.7f, true,
                                    "Simple, practical routines to start each day calmer and more focused, with short "
                                            + "exercises you can do in ten minutes. Paperback, 224 pages.",
                                    "mindful-mornings-self-help-guide.jpg", "Standard", 60, "Paperback"),
                            new ProductDef("BOOKS", "STATIONERY", "Slate Hardcover Notebook",
                                    "slate-hardcover-notebook", "Slate & Co.", "349.00", 4.5f, false,
                                    "A linen-bound A5 hardcover notebook with 192 pages of thick, ink-friendly ruled paper, "
                                            + "a ribbon bookmark and a lay-flat binding.",
                                    "slate-hardcover-notebook.jpg", "Charcoal", 80, "A5"),
                            new ProductDef("SPORTS", "YOGA_FITNESS", "FlexGrip Yoga Mat",
                                    "flexgrip-yoga-mat", "FlexGrip", "1199.00", 4.6f, true,
                                    "A 6 mm cushioned, non-slip yoga mat that grips on both sides. Lightweight, easy to clean "
                                            + "and rolls up for travel. 183 x 61 cm.",
                                    "flexgrip-yoga-mat.jpg", "Turquoise", 35, "6 mm"),
                            new ProductDef("SPORTS", "STRENGTH", "IronCore Adjustable Dumbbell Set",
                                    "ironcore-adjustable-dumbbell-set", "IronCore", "3299.00", 4.5f, false,
                                    "A 20 kg cast-iron dumbbell set with two chrome handles, spin-lock collars and "
                                            + "interchangeable plates for building strength at home.",
                                    "ironcore-dumbbell-set.jpg", "Silver", 10, "20 kg"),
                            new ProductDef("BEAUTY", "FRAGRANCE", "Velvet Bloom Perfume Oil",
                                    "velvet-bloom-perfume-oil", "Velvet", "749.00", 4.3f, true,
                                    "An alcohol-free roll-on perfume oil with soft notes of jasmine, peony and warm vanilla. "
                                            + "Long-lasting and travel friendly. 10 ml.",
                                    "velvet-bloom-perfume-oil.jpg", "Standard", 45, "10 ml"),
                            new ProductDef("BEAUTY", "SKINCARE", "HydraGlow Hydrating Face Lotion",
                                    "hydraglow-hydrating-face-lotion", "HydraGlow", "599.00", 4.4f, false,
                                    "A lightweight daily face lotion with hyaluronic acid and aloe that hydrates without "
                                            + "feeling greasy. Suitable for all skin types. 50 ml.",
                                    "hydraglow-hydrating-face-lotion.jpg", "Standard", 50, "50 ml")))
    );

    // ---------------------------------------------------------------- startup

    @Override
    @Transactional
    public void run(String... args) {
        authorityService.ensureAuthority(AuthorityService.USER, "User role");
        Authority admin = authorityService.ensureAuthority(AuthorityService.ADMIN, "Admin role");
        promoteAdmin(admin);

        if (seedEnabled) {
            applyCatalogBatches();
        }
    }

    private void applyCatalogBatches() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS seed_history (version INT PRIMARY KEY, applied_at TIMESTAMP NOT NULL)");
        Set<Integer> applied = jdbc.queryForList("SELECT version FROM seed_history", Integer.class)
                .stream().collect(Collectors.toSet());

        // Databases seeded before batches were tracked already contain batch 1
        if (applied.isEmpty() && categoryRepository.count() > 0) {
            markApplied(1);
            applied.add(1);
        }

        for (Batch batch : BATCHES) {
            if (applied.contains(batch.version())) {
                continue;
            }
            int added = applyBatch(batch);
            markApplied(batch.version());
            log.info("Catalog batch {} applied: {} products added", batch.version(), added);
        }
    }

    private int applyBatch(Batch batch) {
        for (TypeDef type : batch.types()) {
            ensureType(type);
        }
        int added = 0;
        for (ProductDef def : batch.products()) {
            if (productRepository.findBySlug(def.slug()) == null) {
                createProduct(def);
                added++;
            }
        }
        return added;
    }

    private void markApplied(int version) {
        jdbc.update("INSERT INTO seed_history (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)", version);
    }

    private Category ensureCategory(String code) {
        return categoryRepository.findByCode(code).orElseGet(() -> {
            CategoryDef def = CATEGORIES.stream().filter(c -> c.code().equals(code)).findFirst()
                    .orElseThrow(() -> new IllegalStateException("Unknown category " + code));
            Category category = Category.builder().code(def.code()).name(def.name())
                    .description(def.description()).categoryTypes(new ArrayList<>()).build();
            return categoryRepository.save(category);
        });
    }

    private CategoryType ensureType(TypeDef def) {
        Category category = ensureCategory(def.category());
        if (category.getCategoryTypes() == null) {
            category.setCategoryTypes(new ArrayList<>());
        }
        return category.getCategoryTypes().stream().filter(t -> def.code().equals(t.getCode())).findFirst()
                .orElseGet(() -> {
                    CategoryType type = CategoryType.builder().code(def.code()).name(def.name())
                            .description(def.description()).category(category).build();
                    entityManager.persist(type);
                    category.getCategoryTypes().add(type);
                    return type;
                });
    }

    private void createProduct(ProductDef def) {
        Category category = ensureCategory(def.category());
        CategoryType type = category.getCategoryTypes().stream().filter(t -> def.type().equals(t.getCode()))
                .findFirst().orElseThrow(() -> new IllegalStateException("Unknown type " + def.type()));

        Product product = Product.builder()
                .name(def.name())
                .slug(def.slug())
                .brand(def.brand())
                .price(new BigDecimal(def.price()))
                .rating(def.rating())
                .isNewArrival(def.newArrival())
                .description(def.description())
                .category(category)
                .categoryType(type)
                .build();

        List<ProductVariant> variants = new ArrayList<>();
        for (String size : def.sizes()) {
            variants.add(ProductVariant.builder().color(def.color()).size(size)
                    .stockQuantity(def.stock()).product(product).build());
        }
        product.setProductVariants(variants);

        Resources image = Resources.builder().name(def.image()).url("/images/products/" + def.image())
                .type("image").isPrimary(true).product(product).build();
        product.setResources(new ArrayList<>(List.of(image)));

        productRepository.save(product);
    }

    private void promoteAdmin(Authority admin) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }
        User user = userRepository.findByEmail(adminEmail.trim());
        if (user == null) {
            log.info("ADMIN_EMAIL is set; {} will get admin access when that account is created.", adminEmail);
            return;
        }
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> AuthorityService.ADMIN.equals(a.getAuthority()));
        if (!isAdmin) {
            List<Authority> roles = new ArrayList<>(user.getAuthorities().stream().map(a -> (Authority) a).toList());
            roles.add(admin);
            user.setAuthorities(roles);
            userRepository.save(user);
            log.info("Granted admin access to {}", adminEmail);
        }
    }
}
