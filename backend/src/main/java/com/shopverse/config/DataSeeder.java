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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Prepares a fresh database: creates the USER/ADMIN roles, promotes the
 * configured admin account, and loads the starter ShopVerse catalog when
 * the store has no categories yet.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AuthorityService authorityService;
    private final UserDetailRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.admin.email:}")
    private String adminEmail;

    public DataSeeder(AuthorityService authorityService, UserDetailRepository userRepository,
                      CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.authorityService = authorityService;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        authorityService.ensureAuthority(AuthorityService.USER, "User role");
        Authority admin = authorityService.ensureAuthority(AuthorityService.ADMIN, "Admin role");
        promoteAdmin(admin);

        if (seedEnabled && categoryRepository.count() == 0) {
            seedCatalog();
        }
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

    private void seedCatalog() {
        log.info("Seeding the ShopVerse starter catalog");

        product(category("ELECTRONICS", "Electronics", "Headphones, gadgets and smart devices",
                        "AUDIO", "Audio", "Headphones, earbuds and speakers"),
                "Aurora Wireless Noise-Cancelling Headphones", "aurora-wireless-noise-cancelling-headphones",
                "Aurora", "4999.00", 4.6f, true,
                "Over-ear Bluetooth headphones with active noise cancellation, up to 30 hours of battery life "
                        + "and soft memory-foam ear cushions. Folds flat into the included travel case.",
                "/images/products/aurora-anc-headphones.jpg",
                variants("Black", 25, "One Size"));

        product(category("FASHION", "Fashion", "Everyday clothing and style essentials",
                        "MENS_SHIRTS", "Men's Shirts", "Casual and formal shirts for men"),
                "Meridian Men's Cotton Casual Shirt", "meridian-mens-cotton-casual-shirt",
                "Meridian", "1299.00", 4.4f, true,
                "A breathable 100% cotton shirt in deep navy with a regular fit, button-down front and a chest "
                        + "pocket. Easy to dress up for work or down for the weekend.",
                "/images/products/meridian-cotton-shirt.jpg",
                variants("Navy", 20, "S", "M", "L", "XL"));

        product(category("HOME_KITCHEN", "Home & Kitchen", "Cookware and essentials for every home",
                        "COOKWARE", "Cookware", "Pots, pans and cookware sets"),
                "TerraCook 12-Piece Nonstick Cookware Set", "terracook-12-piece-nonstick-cookware-set",
                "TerraCook", "3499.00", 4.5f, false,
                "Granite-finish nonstick pots and pans with tempered glass lids. PFOA-free, dishwasher safe, "
                        + "and works on gas and induction cooktops.",
                "/images/products/terracook-cookware-set.jpg",
                variants("Black", 15, "12-Piece Set"));

        product(category("BOOKS", "Books", "Bestsellers, fiction and more",
                        "FICTION", "Fiction", "Novels and short stories"),
                "The Quiet Library — Bestseller Novel", "the-quiet-library-bestseller-novel",
                "Inkwell Press", "999.00", 4.8f, true,
                "A quietly powerful story about a small-town librarian, a lost manuscript and the readers it "
                        + "brings together. Paperback, 384 pages.",
                "/images/products/quiet-library-novel.jpg",
                variants("Standard", 50, "Paperback"));

        product(category("SPORTS", "Sports", "Gear for training, running and the outdoors",
                        "RUNNING", "Running", "Running shoes and accessories"),
                "Velocity Pro Running Shoes", "velocity-pro-running-shoes",
                "Velocity", "2799.00", 4.5f, false,
                "Lightweight running shoes with a breathable knit upper, responsive cushioning and a durable "
                        + "rubber outsole built for daily road runs.",
                "/images/products/velocity-pro-running-shoes.jpg",
                variants("Blue", 12, "UK 7", "UK 8", "UK 9", "UK 10"));

        product(category("BEAUTY", "Beauty", "Skincare and personal care",
                        "SKINCARE", "Skincare", "Serums, moisturisers and cleansers"),
                "Lumina Vitamin C Brightening Serum", "lumina-vitamin-c-brightening-serum",
                "Lumina", "899.00", 4.3f, false,
                "A lightweight vitamin C serum with hyaluronic acid that brightens dull skin and evens out "
                        + "skin tone. Gentle enough for daily use. 30 ml.",
                "/images/products/lumina-vitamin-c-serum.jpg",
                variants("Standard", 40, "30 ml"));
    }

    private Category category(String code, String name, String description,
                              String typeCode, String typeName, String typeDescription) {
        Category category = Category.builder().code(code).name(name).description(description).build();
        CategoryType type = CategoryType.builder()
                .code(typeCode).name(typeName).description(typeDescription).category(category).build();
        category.setCategoryTypes(new ArrayList<>(List.of(type)));
        return categoryRepository.save(category);
    }

    private List<ProductVariant> variants(String color, int stock, String... sizes) {
        List<ProductVariant> list = new ArrayList<>();
        for (String size : sizes) {
            list.add(ProductVariant.builder().color(color).size(size).stockQuantity(stock).build());
        }
        return list;
    }

    private void product(Category category, String name, String slug, String brand, String price,
                         float rating, boolean newArrival, String description, String imageUrl,
                         List<ProductVariant> variants) {
        Product product = Product.builder()
                .name(name)
                .slug(slug)
                .brand(brand)
                .price(new BigDecimal(price))
                .rating(rating)
                .isNewArrival(newArrival)
                .description(description)
                .category(category)
                .categoryType(category.getCategoryTypes().get(0))
                .build();

        variants.forEach(v -> v.setProduct(product));
        product.setProductVariants(variants);

        Resources image = Resources.builder()
                .name(slug + ".jpg").url(imageUrl).type("image").isPrimary(true).product(product).build();
        product.setResources(new ArrayList<>(List.of(image)));

        productRepository.save(product);
    }
}
