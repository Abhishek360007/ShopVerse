package com.shopverse.auth.services;

import com.shopverse.auth.entities.Authority;
import com.shopverse.auth.repositories.AuthorityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AuthorityService {

    public static final String USER = "USER";
    public static final String ADMIN = "ADMIN";

    @Autowired
    private AuthorityRepository authorityRepository;

    /** Email of the store owner. The account registered with this email gets the ADMIN role. */
    @Value("${app.admin.email:}")
    private String adminEmail;

    /** Returns the role, creating it first if the database doesn't have it yet. */
    public Authority ensureAuthority(String role, String description) {
        Authority authority = authorityRepository.findByRoleCode(role);
        if (authority == null) {
            authority = createAuthority(role, description);
        }
        return authority;
    }

    public List<Authority> getUserAuthority() {
        List<Authority> authorities = new ArrayList<>();
        authorities.add(ensureAuthority(USER, "User role"));
        return authorities;
    }

    /** Roles for a new account: USER for everyone, plus ADMIN for the configured store owner. */
    public List<Authority> getAuthoritiesFor(String email) {
        List<Authority> authorities = getUserAuthority();
        if (isAdminEmail(email)) {
            authorities.add(ensureAuthority(ADMIN, "Admin role"));
        }
        return authorities;
    }

    public boolean isAdminEmail(String email) {
        return email != null && adminEmail != null && !adminEmail.isBlank()
                && adminEmail.trim().equalsIgnoreCase(email.trim());
    }

    public Authority createAuthority(String role, String description) {
        Authority authority = Authority.builder().roleCode(role).roleDescription(description).build();
        return authorityRepository.save(authority);
    }
}
