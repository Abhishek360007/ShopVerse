package com.shopverse.auth.services;

import com.shopverse.auth.entities.Authority;
import com.shopverse.auth.repositories.AuthorityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthorityServiceTest {

    @Mock
    private AuthorityRepository repository;

    @InjectMocks
    private AuthorityService service;

    private final Authority user = Authority.builder().roleCode("USER").roleDescription("User role").build();
    private final Authority admin = Authority.builder().roleCode("ADMIN").roleDescription("Admin role").build();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "adminEmail", "owner@shopverse.com");
    }

    @Test
    void regularAccountGetsOnlyUserRole() {
        when(repository.findByRoleCode("USER")).thenReturn(user);

        List<Authority> roles = service.getAuthoritiesFor("shopper@example.com");

        assertEquals(List.of(user), roles);
    }

    @Test
    void adminEmailGetsAdminRoleIgnoringCase() {
        when(repository.findByRoleCode("USER")).thenReturn(user);
        when(repository.findByRoleCode("ADMIN")).thenReturn(admin);

        List<Authority> roles = service.getAuthoritiesFor("Owner@ShopVerse.com");

        assertEquals(List.of(user, admin), roles);
    }

    @Test
    void createsMissingRole() {
        when(repository.findByRoleCode("USER")).thenReturn(null);
        when(repository.save(any(Authority.class))).thenAnswer(inv -> inv.getArgument(0));

        Authority created = service.ensureAuthority("USER", "User role");

        assertEquals("USER", created.getRoleCode());
        verify(repository).save(any(Authority.class));
    }

    @Test
    void noAdminWhenAdminEmailNotConfigured() {
        ReflectionTestUtils.setField(service, "adminEmail", "");
        assertFalse(service.isAdminEmail("owner@shopverse.com"));
        assertFalse(service.isAdminEmail(null));
    }
}
