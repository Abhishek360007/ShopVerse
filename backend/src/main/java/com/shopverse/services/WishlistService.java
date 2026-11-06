package com.shopverse.services;

import com.shopverse.auth.entities.User;
import com.shopverse.dto.ProductDto;
import com.shopverse.entities.Product;
import com.shopverse.entities.WishlistItem;
import com.shopverse.mapper.ProductMapper;
import com.shopverse.repositories.ProductRepository;
import com.shopverse.repositories.WishlistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** Saved products, stored per customer so the wishlist follows them across devices. */
@Service
public class WishlistService {

    static final int MAX_ITEMS = 100;

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final UserDetailsService userDetailsService;

    public WishlistService(WishlistRepository wishlistRepository, ProductRepository productRepository,
                           ProductMapper productMapper, UserDetailsService userDetailsService) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.userDetailsService = userDetailsService;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> list(String email) {
        return toProducts(user(email));
    }

    @Transactional
    public List<ProductDto> add(String email, UUID productId) {
        User user = user(email);
        addIfMissing(user, productId, true);
        return toProducts(user);
    }

    @Transactional
    public List<ProductDto> remove(String email, UUID productId) {
        User user = user(email);
        wishlistRepository.deleteByUserAndProduct_Id(user, productId);
        return toProducts(user);
    }

    /** Adds products a guest saved before signing in; unknown products are skipped. */
    @Transactional
    public List<ProductDto> merge(String email, Collection<UUID> productIds) {
        User user = user(email);
        if (productIds != null) {
            productIds.stream().distinct().limit(MAX_ITEMS).forEach(id -> addIfMissing(user, id, false));
        }
        return toProducts(user);
    }

    private void addIfMissing(User user, UUID productId, boolean failIfUnknown) {
        if (productId == null || wishlistRepository.existsByUserAndProduct_Id(user, productId)) {
            return;
        }
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            if (failIfUnknown) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            return;
        }
        if (wishlistRepository.findByUserOrderByCreatedAtDesc(user).size() >= MAX_ITEMS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your wishlist is full");
        }
        wishlistRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    private List<ProductDto> toProducts(User user) {
        List<Product> products = wishlistRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(WishlistItem::getProduct).toList();
        return productMapper.getProductDtos(products);
    }

    private User user(String email) {
        return (User) userDetailsService.loadUserByUsername(email);
    }
}
