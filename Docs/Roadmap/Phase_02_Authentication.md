# Phase 2 — Authentication

## 1. Module Overview: JWT Authentication Service

### Purpose
To secure all Spring Boot API endpoints using JWT authentication, manage user registration and session verification, and map identities to the relational schema.

### Dependencies
- Phase 1 (Project Setup & Database running).

### Inputs
- Credentials (`email`, `password`) or JWT token.

### Outputs
- Signed Bearer token.
- Populated `SecurityContext` in the Spring thread.

---

## 2. Intended Folder Structure (Spring Boot Backend)

The authentication module will sit within the backend package structure:

```text
phoenix-backend/src/main/java/com/resume/phoenix/
└── auth/
    ├── config/
    │   ├── SecurityConfig.java          # Spring Security 6.x Setup
    │   └── JwtAuthenticationFilter.java # Custom Request interceptor
    ├── controller/
    │   └── AuthController.java          # /login & /register handlers
    ├── dto/
    │   ├── LoginRequest.java
    │   ├── RegisterRequest.java
    │   └── AuthResponse.java
    ├── entity/
    │   └── User.java                    # Entity mapping database table 'users'
    ├── repository/
    │   └── UserRepository.java
    └── service/
        ├── AuthService.java
        └── JwtService.java
```

---

## 3. Configuration & DTO Specifications

### `User` Entity Fields:
- `UUID id` (Primary Key).
- `String email` (Unique, Not Null).
- `String passwordHash` (Not Null).
- `String fullName` (Nullable).

### Shared DTOs:
- **`RegisterRequest`**: Fields: `{ email, password, fullName }` with `@NotBlank` and `@Email` validation constraints.
- **`LoginRequest`**: Fields: `{ email, password }` with validation constraints.
- **`AuthResponse`**: Fields: `{ token, refreshToken, UserDto }`.

### Exception Handling & Security
- Invalid credential returns `401 Unauthorized` status using a custom authentication entry point handler.
- Hashing uses BCrypt with strength parameter 12.
- CORS filter mapping local React development port (`http://localhost:5173`).

---

## 4. Atomic Implementation Task List

### Task 2.1: Create Database Migration (Liquibase/Flyway) or DDL for Users Table
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 1.3
- **Description**: Add the database table schema definition for `users` corresponding to the spec sheet.
- **Definition of Done**: DB table created in Postgres with correct constraints; column validation check succeeds.

### Task 2.2: Implement User Entity & UserRepository
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 2.1
- **Description**: Create Java class `User` mapping PostgreSQL table `users` using JPA annotations, and write `UserRepository` extending `JpaRepository` with custom `findByEmail` method.
- **Definition of Done**: Class compiles, unit tests verify data saving and retrieving by email works.

### Task 2.3: Implement Password Hashing & JwtService
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 2.2
- **Description**: Write `JwtService` responsible for generating, decoding, validating JWT tokens with HS256 algorithm and configured signing keys. Add BCrypt password encoder configuration bean.
- **Definition of Done**: Tests verify signed JWT can be decrypted, verifying claims (e.g., expiration date, username) matches.

### Task 2.4: Configure Spring Security Config & JwtAuthenticationFilter
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 2.3
- **Description**: Setup `JwtAuthenticationFilter` extending `OncePerRequestFilter` to extract headers, decode JWT, and populate Spring Security Context. Write `SecurityConfig` to restrict paths to authenticated requests.
- **Definition of Done**: Requests with valid Authorization header proceed; requests without headers to secured paths return 401 Unauthorized.

### Task 2.5: Implement AuthService & AuthController endpoints
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 2.4
- **Description**: Build `AuthService` handling Registration (hash password, save entity) and Login (verify hashes, return token payload). Create endpoints `POST /api/auth/register` and `POST /api/auth/login`.
- **Definition of Done**: Requests to `/register` successfully creates users; requests to `/login` yields token return payload.

### Task 2.6: Write Integration Tests for Authentication
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 2.5
- **Description**: Write MockMvc integration tests targeting register/login flow scenarios (happy path, validation failures, invalid credentials).
- **Definition of Done**: Integration tests execution run and pass successfully.
