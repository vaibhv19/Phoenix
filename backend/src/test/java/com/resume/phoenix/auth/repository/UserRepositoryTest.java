package com.resume.phoenix.auth.repository;

import com.resume.phoenix.auth.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSaveAndFindByEmail() {
        // Given
        User user = User.builder()
                .username("testrepo")
                .email("test-repo@example.com")
                .passwordHash("hashed-password-xyz")
                .fullName("John Doe")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertThat(savedUser.getId()).isNotNull();
        
        Optional<User> foundUser = userRepository.findByEmail("test-repo@example.com");
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getFullName()).isEqualTo("John Doe");
        assertThat(foundUser.get().getPasswordHash()).isEqualTo("hashed-password-xyz");
        assertThat(foundUser.get().getUsername()).isEqualTo("testrepo");

        Optional<User> foundByUsername = userRepository.findByUsername("testrepo");
        assertThat(foundByUsername).isPresent();

        Optional<User> foundByEmailOrUsername1 = userRepository.findByEmailOrUsername("test-repo@example.com", "any");
        assertThat(foundByEmailOrUsername1).isPresent();

        Optional<User> foundByEmailOrUsername2 = userRepository.findByEmailOrUsername("any", "testrepo");
        assertThat(foundByEmailOrUsername2).isPresent();
    }
}
