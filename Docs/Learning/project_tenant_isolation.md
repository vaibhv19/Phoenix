# Project Tenant Isolation & Security Boundary

This document details the multi-tenant architectural boundary design implemented in Phase 03 of the Phoenix project. It serves as a guide to understanding how user workspaces, documents, chunks, and query histories are isolated.

---

## 1. What Problem is Being Solved?

In a retrieval-augmented generation (RAG) platform, users upload sensitive documents and perform chats containing proprietary information.
Without proper boundaries, three critical risks arise:
1. **Data Leakage:** User A accidentally retrieves chunks or queries from User B's documents.
2. **Access Violations:** User A attempts to view, modify, or delete project configuration records owned by User B.
3. **High Blast Radius:** An ingestion failure or deletion in one project impacts resources outside of its containment scope.

The projects module acts as the **logical tenant boundary** to prevent these issues by isolating technical documents, chunks, and query histories.

---

## 2. Why This Solution Was Selected?

Phoenix implements a **Logical Tenant Isolation Model** within a shared schema database:
- **Explicit Ownership Validation:** Each project stores a `user_id` foreign key referencing the `users` table. Every read, write, or delete operation validates the owner by comparing the database record against the authenticated user ID extracted directly from the Spring Security context (`@AuthenticationPrincipal`).
- **Standardized Exception Handling:** Violation attempts throw `AccessDeniedException`, which translates to a standard HTTP `403 Forbidden` response.
- **Relational Integrity:** Foreign key constraint deletes cascade (`ON DELETE CASCADE`), ensuring that deleting a project automatically cleans up all associated documents, chunks, and chat history.

---

## 3. Alternative Approaches Considered

### A. Row-Level Security (RLS) in PostgreSQL
* **Pros:** Handled automatically by the database layer.
* **Cons:** Harder to manage and debug via JPA/Hibernate, requires custom session configuration, and complicates multi-tenant connection pooling.
* **Phoenix Decision:** Rejected in favor of programmatic service-layer isolation to keep the DB access layer highly transparent and testable.

### B. Separate Database per Tenant
* **Pros:** Physical isolation, zero risk of data leakage at the query layer.
* **Cons:** Extremely high overhead, high infrastructure cost, and complex database migration orchestration.
* **Phoenix Decision:** Rejected because Phoenix is designed for lightweight, scalable personal workspaces where logical partition is sufficient.

---

## 4. Internal Working & How Phoenix Uses It

1. **Authentication Interception:** The client sends a Bearer Token (JWT). `JwtAuthenticationFilter` validates the token and sets the custom `User` entity instance in the `SecurityContext`.
2. **Controller Context Injection:** In `ProjectController`, the `@AuthenticationPrincipal User user` annotation resolves the authenticated user. The controller extracts the user's UUID and forwards it to the service layer.
3. **Service Layer Assertion:** `ProjectService` runs a sanity check on retrieval/deletion:
   - It fetches the project by ID.
   - It asserts that `project.getUserId().equals(authenticatedUserId)`.
   - If not equal, it throws `AccessDeniedException`.

---

## 5. Important Classes and Packages

- `com.resume.phoenix.project.entity.Project`: Entity class mapping the `projects` table.
- `com.resume.phoenix.project.repository.ProjectRepository`: Standard Spring Data repository containing filter queries:
  - `findByUserId(UUID userId)`
  - `findByIdAndUserId(UUID id, UUID userId)`
- `com.resume.phoenix.project.service.ProjectService`: Service containing CRUD logic and the security assertion boundary.
- `com.resume.phoenix.project.controller.ProjectController`: REST controller handling validation, user principal mapping, and HTTP responses.

---

## 6. Common Pitfalls & Debugging Tips

- **Manually Assigned UUIDs in Tests:**
  When writing JPA tests, manually configuring the UUID (e.g., `User.builder().id(UUID.randomUUID()).build()`) can violate foreign key constraints. This is because Hibernate's `@GeneratedValue(strategy = GenerationType.AUTO)` generates its own ID and discards the manually assigned value.
  *Fix:* Always capture the returned entity from `userRepository.save(user)` to read the database-generated ID.
- **ClassCastException in Test Security Contexts:**
  Using `@WithMockUser` in integration tests creates a standard Spring Security `UserDetails` principal instead of the custom `User` entity.
  *Fix:* Use `SecurityMockMvcRequestPostProcessors.user(user)` to pass the actual saved custom user entity.

---

## 7. Interview Discussion Points

- **Q:** How do you guarantee that a user cannot manipulate the URL path variable (e.g. `DELETE /api/projects/{id}`) to delete someone else's project?
- **A:** The system performs an ownership verification check inside `ProjectService.deleteProject`. It loads the project by ID, verifies that the `userId` in the record matches the ID of the principal in the security context, and throws an `AccessDeniedException` if they do not match.

---

## 8. References

- [Spring Security Reference Documentation](https://docs.spring.io/spring-security/reference/index.html)
- [Hibernate ORM User Guide](https://hibernate.org/orm/documentation/)
