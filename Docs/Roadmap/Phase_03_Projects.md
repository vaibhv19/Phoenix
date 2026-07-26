# Phase 3 — Projects

## 1. Module Overview: Project Multi-Tenant Boundary

### Purpose
To manage projects, which serve as logical tenant boundaries to isolate technical documents, chunks, and query history. Each user can own multiple projects.

### Dependencies
- Phase 2 (Authentication active).

### Inputs
- User identity (`UUID user_id` fetched from JWT principal).
- Request parameters (Project name, metadata details).

### Outputs
- Logical project containment scopes.
- CRUD project configurations.

---

## 2. Intended Folder Structure (Spring Boot Backend)

The project scope module will follow the standard backend layout:

```text
phoenix-backend/src/main/java/com/resume/phoenix/
└── project/
    ├── controller/
    │   └── ProjectController.java       # CRUD REST endpoints (/projects)
    ├── dto/
    │   ├── ProjectRequest.java
    │   └── ProjectResponse.java
    ├── entity/
    │   └── Project.java                 # Entity mapping database table 'projects'
    ├── repository/
    │   └── ProjectRepository.java
    └── service/
        └── ProjectService.java
```

---

## 3. Configuration & Entity Relationships

### `Project` Entity Fields:
- `UUID id` (Primary Key).
- `UUID userId` (Foreign Key referencing `users.id`).
- `String name` (Not Null).
- `Instant createdAt` (Not Null).

### Security Requirements:
- A user must only view, modify, or query projects belonging to them.
- Any repository queries must join on `userId` extracted from token security context.

---

## 4. Atomic Implementation Task List

### Task 3.1: Create Database Migration (Liquibase/Flyway) or DDL for Projects Table
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 2.1
- **Description**: Add database table definition for `projects` mapped against the schema specification.
- **Definition of Done**: DB table created in Postgres with correct foreign key constraints referencing `users.id`.

### Task 3.2: Implement Project Entity & ProjectRepository
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 3.1
- **Description**: Create the Java class `Project` with appropriate JPA mapping annotations, and write `ProjectRepository` with custom query methods `findByUserId` and `findByIdAndUserId`.
- **Definition of Done**: Repository code compiles and persists data mapping entity rules; unit tests pass.

### Task 3.3: Implement ProjectService
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 3.2
- **Description**: Write `ProjectService` implementing CRUD operations for Projects. Ensure tenant isolation by passing user UUID context check parameters to all service methods.
- **Definition of Done**: Service methods implemented, verified via unit tests checking that query attempts targeting other user IDs throw a security exception.

### Task 3.4: Implement ProjectController
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 3.3
- **Description**: Expose REST endpoints:
  - `POST /api/projects` (Create project)
  - `GET /api/projects` (List projects for authenticated user)
  - `DELETE /api/projects/{id}` (Delete project)
- **Definition of Done**: Controllers bind parameters properly; security intercepts unauthenticated traffic.

### Task 3.5: Write Integration & Validation Tests for Projects
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 3.4
- **Description**: Perform API integration testing. Assert validation checks (empty project names return 400 Bad Request) and verify isolation bounds.
- **Definition of Done**: Integration tests pass successfully.
