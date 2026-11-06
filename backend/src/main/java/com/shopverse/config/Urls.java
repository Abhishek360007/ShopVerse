package com.shopverse.config;

/** Small helpers for addresses that may come from a hosting platform as a bare host name. */
public final class Urls {

    private Urls() {
    }

    /** "shop.onrender.com" -> "https://shop.onrender.com"; full URLs are kept; trailing slash removed. */
    public static String withScheme(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String value = url.trim();
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
