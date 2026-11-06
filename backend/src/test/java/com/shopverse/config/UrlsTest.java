package com.shopverse.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UrlsTest {

    @Test
    void addsHttpsToBareHostNames() {
        assertEquals("https://shopverse-web.onrender.com", Urls.withScheme("shopverse-web.onrender.com"));
    }

    @Test
    void keepsFullUrlsAndDropsTrailingSlash() {
        assertEquals("http://localhost:3000", Urls.withScheme("http://localhost:3000/"));
        assertEquals("https://shop.example.com", Urls.withScheme(" https://shop.example.com "));
    }
}
