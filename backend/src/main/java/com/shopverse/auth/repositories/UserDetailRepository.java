package com.shopverse.auth.repositories;

import com.shopverse.auth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDetailRepository extends JpaRepository<User,Long> {

    /** Users by their (UUID) ids. The repository is declared with Long, so findAllById can't be used. */
    java.util.List<User> findByIdIn(java.util.Collection<java.util.UUID> ids);
    User findByEmail(String username);

    long countByCreatedOnGreaterThanEqual(java.util.Date since);
}
