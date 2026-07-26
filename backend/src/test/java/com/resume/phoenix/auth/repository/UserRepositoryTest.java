package com.resume.phoenix.auth.repository;

import com.resume.phoenix.auth.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

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
    }
}
