# Spring Boot Backend Service

This module handles the core administrative, security, and storage capabilities of the Phoenix platform. It exposes REST API gateways for authentication, project namespaces, and file storage parsing.

---

## Architecture & Design Patterns

The service is built on **Spring Boot 3.3.x** and adheres to a clean layered Controller-Service-Repository architecture:

1. **Security Layer**: Custom filters validate incoming JWT tokens and inject user authentication details into the SecurityContext.
2. **Project Namespace (Multi-Tenancy)**: High-security row-level boundaries protect tenant data. User A cannot view, edit, delete, or upload documents to Project B (owned by User B).
3. **Storage Engine**: Manages local filesystem storage with path traversal guards (`../` prevention) and file extension verification (PDF only).
4. **FastAPI Client**: Async RestClient handles file ingestion triggers and fetches document status logs from the Python service.

---

## Directory Layout

```text
backend/src/main/java/com/resume/phoenix/
├── auth/                 # Spring Security, JWT filters, Auth controller/services
├── project/              # Project namespaces CRUD, Services, JPA Repositories
│   ├── controller/
│   ├── service/
│   ├── entity/
│   └── repository/
├── document/             # Document storage and status REST routes
│   ├── controller/
│   ├── service/
│   └── client/           # FastAPI rest-client and request DTOs
└── exception/            # Global exception handlers and error mapping
```

---

## Startup & Configuration

### Prerequisites
- Java JDK 21
- Active PostgreSQL Database with `pgvector` extension (running on port `5432`)

### 1. Configuration
Review configurations inside `backend/src/main/resources/application.properties`:
```properties
# Database connection
spring.datasource.url=jdbc:postgresql://localhost:5432/phoenix
spring.datasource.username=postgres
spring.datasource.password=postgres

# AI Engine FastAPI connection URL
ai.engine.url=http://localhost:8000
```

### 2. Launching Application
Build compile packages and start the application:
```bash
mvn clean install
mvn spring-boot:run
```
Flyway migrations will run automatically on startup to apply tables (`users`, `projects`, `documents`, `document_chunks`).

---

## API Documentation

### Auth Gateway
- `POST /api/auth/register` - Create a user account.
- `POST /api/auth/login` - Authenticate credentials and receive Bearer token.

### Projects
- `GET /api/projects` - List all projects owned by authenticated user.
- `POST /api/projects` - Create a project workspace.
- `DELETE /api/projects/{projectId}` - Delete project (cascades chunk deletes).

### Documents
- `GET /api/projects/{projectId}/documents` - List files in the project vault.
- `POST /api/projects/{projectId}/upload` - Upload PDF manual for ingestion.

---

## Testing & Verifications

Run the backend integration and security test suite using:
```bash
mvn test
```
- **`SecurityBoundaryTest`**: Asserts user access rules and tenant validation logic.
- **`UploadValidationTest`**: Verifies path traversal protections and size constraints on multi-part uploads.
