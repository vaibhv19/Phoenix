package com.resume.phoenix.auth.config;

import com.resume.phoenix.auth.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserDetailsService userDetailsService;

    @MockBean
    private JwtService jwtService;

    @Test
    void testUnsecuredEndpointsAllowed() throws Exception {
        // GET /api/auth/test should be allowed (since /api/auth/** is permitAll)
        mockMvc.perform(get("/api/auth/test"))
                .andExpect(status().isNotFound()); // NotFound is expected because the controller doesn't exist, but it's not 401 Unauthorized!
    }

    @Test
    void testSecuredEndpointsDeniedWithoutToken() throws Exception {
        // GET /api/secured should return 401 Unauthorized
        mockMvc.perform(get("/api/secured"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testSecuredEndpointsAllowedWithValidToken() throws Exception {
        String token = "valid-token";
        String email = "test-user@example.com";
        var userDetails = new User(email, "password", Collections.emptyList());

        when(jwtService.extractUsername(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, userDetails)).thenReturn(true);

        // GET /api/secured with valid bearer token should return 404 (not found) instead of 401 (unauthorized)
        mockMvc.perform(get("/api/secured")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
