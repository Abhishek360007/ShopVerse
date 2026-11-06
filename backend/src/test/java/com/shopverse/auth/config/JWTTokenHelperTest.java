package com.shopverse.auth.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JWTTokenHelperTest {

    private JWTTokenHelper helper;

    @BeforeEach
    void setUp() {
        helper = new JWTTokenHelper();
        String secret = Base64.getEncoder().encodeToString("shopverse-test-secret-key-that-is-long-enough!".getBytes());
        ReflectionTestUtils.setField(helper, "appName", "shopverse-test");
        ReflectionTestUtils.setField(helper, "secretKey", secret);
        ReflectionTestUtils.setField(helper, "expiresIn", 3600);
    }

    private UserDetails user(String name) {
        return new User(name, "password", List.of());
    }

    @Test
    void generatedTokenContainsUsername() {
        String token = helper.generateToken("jane@shopverse.com");
        assertEquals("jane@shopverse.com", helper.getUserNameFromToken(token));
    }

    @Test
    void validTokenPassesValidation() {
        String token = helper.generateToken("jane@shopverse.com");
        assertTrue(helper.validateToken(token, user("jane@shopverse.com")));
    }

    @Test
    void tokenForAnotherUserFailsValidation() {
        String token = helper.generateToken("jane@shopverse.com");
        assertFalse(helper.validateToken(token, user("john@shopverse.com")));
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = helper.generateToken("jane@shopverse.com");
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");
        assertNull(helper.getUserNameFromToken(tampered));
        assertFalse(helper.validateToken(tampered, user("jane@shopverse.com")));
    }

    @Test
    void extractsBearerTokenFromHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer abc.def.ghi");
        assertEquals("abc.def.ghi", helper.getToken(request));
    }

    @Test
    void returnsNullWhenNoAuthHeader() {
        assertNull(helper.getToken(new MockHttpServletRequest()));
    }
}
