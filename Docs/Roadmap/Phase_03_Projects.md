# Phase 3 — Projects Playbook

This document details the audit, retrofit strategy, and upgraded implementation playbook for establishing Project boundaries, which act as user-tenant bounds inside the system.

---

## 1. Phase Audit

During the audit of the original Phase 3 roadmap, the following gaps were identified:
- **Orphaned File Handling**: The original roadmap mentioned deleting projects but did not specify what happens to physical document files stored on disk. The actual implementation in `ProjectService` queries and deletes each physical file from storage before deleting the database project record.
- **Missing Repository Methods**: The roadmap did not detail the custom finders needed in `ProjectRepository` to enforce isolation.
- **Exception Mapping**: The roadmap stated that isolation violations throw "security exceptions" but didn't specify which class (`AccessDeniedException` from Spring Security) or how it translates to an HTTP status.

---

## 2. Retrofit Strategy

To convert this phase into a reliable engineering execution guide:
1. **Document file cleanup hooks**: Detail how `ProjectService` interacts with `StorageService` to clear files.
2. **Explicit isolation checks**: Highlight the `.equals(userId)` validation in services.
3. **Capture API verification payloads**: Add exact JSON request/response shapes for testing the CRUD operations.

---

## 3. Upgraded Implementation Playbook

### 3.1 Phase Overview
- **Objective**: Create projects as logical isolated containers for documents, embeddings, and chat history.
- **Purpose**: Establishes data boundaries so that users can only manage their own project technical scopes.
- **Expected Outcome**: Relational schema tables for projects linked to users with CRUD endpoints.
- **Dependencies**: Phase 2 (Authentication active).

### 3.2 Prerequisites
- Secure auth JWT system working.
- Users table populated with at least one authenticated user.

### 3.3 Environment Configuration
No additional configuration variables are introduced. Standard `.env` properties for JDBC connection and storage directories are utilized.

### 3.4 Dependencies
- `spring-boot-starter-data-jpa` for repository mapping.
- `lombok` for entity builders.

### 3.5 Implementation Guide

#### Step 1: Database Migration
Create `V2__create_projects_table.sql` under `backend/src/main/resources/db/migration/`:
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Step 2: Create `Project` Entity
Build the `Project` class:
- **Properties**: `id` (UUID), `userId` (UUID), `name` (String), `createdAt` (Instant).
- Configure `@Table(name = "projects")` and map the `user_id` column.

#### Step 3: Implement `ProjectRepository`
Expose finders in the repository interface:
- `List<Project> findByUserId(UUID userId)`: Lists projects for a specific user.
- `Optional<Project> findByIdAndUserId(UUID id, UUID userId)`: Helper for fetching isolating instances.

#### Step 4: Write `ProjectService`
Provide CRUD methods with security checks:
- **`createProject`**: Builds a new project instance bound to the caller's user ID.
- **`listProjects`**: Fetches all projects referencing the caller's ID.
- **`deleteProject`**:
  1. Retrieve project by ID.
  2. Validate if `project.getUserId().equals(userId)`. If not, throw `org.springframework.security.access.AccessDeniedException`.
  3. Query `documentRepository.findByProjectId(projectId)` to fetch associated document records.
  4. Loop and call `storageService.delete(storagePath)` to physically delete files.
  5. Delete database record using `projectRepository.delete(project)`.

#### Step 5: Implement `ProjectController`
Expose the endpoints:
- `POST /api/projects` (receives `{ "name": "Project Name" }`).
- `GET /api/projects` (lists caller's projects).
- `DELETE /api/projects/{id}` (deletes project).

Use `@AuthenticationPrincipal User user` to extract security tokens automatically.

### 3.6 Manual Engineering Work
Developers must ensure Flyway schema sequence execution finishes migrations before the Spring context boots JPA validation.

### 3.7 Integration Steps
Verify database constraints:
- Try deleting a user and confirm that PostgreSQL cascades deletions, automatically wiping out all project rows in the child database table.

### 3.8 Verification

#### 1. Create Project:
```bash
curl -X POST http://localhost:8080/api/projects \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"name":"System Setup Specs"}'
```
**Expected Response (200 OK)**:
```json
{
  "id": "27680517-db3f-4a37-b9f0-d6ee63964344",
  "userId": "1537b819-df42-4914-9de5-d8aa62985116",
  "name": "System Setup Specs",
  "createdAt": "2026-07-31T07:10:00Z"
}
```

#### 2. Access Other User's Project:
If User B attempts to access User A's project ID:
```bash
curl -X DELETE http://localhost:8080/api/projects/27680517-db3f-4a37-b9f0-d6ee63964344 \
     -H "Authorization: Bearer <USER_B_JWT_TOKEN>"
```
**Expected Response (403 Forbidden)**:
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied to project with id: 27680517-db3f-4a37-b9f0-d6ee63964344"
}
```

### 3.9 Troubleshooting

#### Issue 1: Orphans on Physical Storage
- **Symptoms**: Project deletion succeeds, but physical files remain in the `storage/` directory.
- **Root Cause**: The database delete executed, but `StorageService` failed silently or bypassed file deletions.
- **Resolution**: Wrap file storage deletions inside a `try-catch` inside the `@Transactional` delete block. Ensure storage paths are relative to the execution root directory.

### 3.10 Completion Checklist
- [x] Schema migration `V2` executed.
- [x] CRUD controllers bind security principal mappings.
- [x] Listing projects yields only user-associated project items.
- [x] Accessing unauthorized project identifiers returns 403 Forbidden.
- [x] Physical file storage cleanup triggers on project deletion.

### 3.11 Lessons Learned
- **Cascade Hooks**: Relying solely on Database cascades (`ON DELETE CASCADE`) only clears database rows. Physical files on disk must be cleaned up programmatically at the service layer first.

---

## 4. Engineering Review

Tenancy bounds have been verified. Cross-user ID access requests are correctly blocked by security policies.

---

## 5. Remaining Recommendations
- Add limits to prevent a single user account from creating an excessive number of projects.
