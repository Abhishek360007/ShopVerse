package com.shopverse.controllers;

import com.shopverse.dto.ProductDto;
import com.shopverse.services.WishlistService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** The signed-in customer's wishlist. Every call returns the full, updated list. */
@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public List<ProductDto> list(Principal principal) {
        return wishlistService.list(principal.getName());
    }

    @PostMapping("/{productId}")
    public List<ProductDto> add(@PathVariable UUID productId, Principal principal) {
        return wishlistService.add(principal.getName(), productId);
    }

    @DeleteMapping("/{productId}")
    public List<ProductDto> remove(@PathVariable UUID productId, Principal principal) {
        return wishlistService.remove(principal.getName(), productId);
    }

    /** Body: {"productIds": ["...", "..."]} — items saved while signed out. */
    @PostMapping("/merge")
    public List<ProductDto> merge(@RequestBody Map<String, List<UUID>> body, Principal principal) {
        return wishlistService.merge(principal.getName(), body.get("productIds"));
    }
}
