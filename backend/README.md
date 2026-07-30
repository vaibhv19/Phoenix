# Spring Boot Backend Gateway Service

This module coordinates user authentication, project multi-tenancy contexts, document file retention, and schedules async handoffs to the FastAPI AI Engine.

---

## 1. Key Responsibilities & Design Patterns

The service is built on **Spring Boot 3.3.1** and Java 21, structured using a Controller-Service-Repository pattern:
1. **Security Filters**: `JwtAuthenticationFilter` intercepts HTTP requests, extracts the JWT, verifies the HMAC-SHA256 signature, and maps the user principal to the security context.
2. **Username-First Identity**: The user profile display names and avatars derive initials exclusively from the registered unique `username` (rather than the email address).
3. **Workspace Isolation**: Projects act as namespaces. Logical row-level checks ensure users cannot upload files, query chat, or fetch documents belonging to another user.
4. **Cascaded Cleanup Transactions**: Deleting a project triggers a cascading database delete of all associated records, simultaneously removing raw PDF binary files from local storage and triggering a vector cleanup in the AI Engine.

---

## 2. Directory Layout

```text
backend/src/main/java/com/resume/phoenix/
├── auth/                 # Spring Security, JWT filters, Auth controller & UserDetails
├── project/              # Project namespaces CRUD controllers & repositories
├── document/             # Document metadata & REST controllers
│   └── client/           # FastAPI rest-client communicating with AI Engine
└── exception/            # Global exception handlers and error JSON translators
```

---

## 3. Environment Configuration

The service loads the following properties from `backend/.env` during boot:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/phoenix
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET_KEY=dGhlLXBob2VuaXgtcmFnLWh5YnJpZC1yZXRyaWV2YWwtc3lzdGVtLXNlY3VyZS1rZXktMjAyNg==
PYTHON_AI_ENGINE_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=storage
```

---

## 4. API Endpoints Reference

### 4.1 Authentication Gateway (`/api/auth`)
* `POST /api/auth/register`: Request body: `{ "username", "email", "password", "confirmPassword", "fullName" }`. Registers user and returns token.
* `POST /api/auth/login`: Request body: `{ "username", "password" }`. Returns JWT token.

### 4.2 Project Management (`/api/projects`)
* `GET /api/projects`: List active workspaces for user principal.
* `POST /api/projects`: Request body: `{ "name" }`. Creates a workspace.
* `DELETE /api/projects/{id}`: Cascades database and filesystem cleanup.

### 4.3 Document Management (`/api/documents`)
* `GET /api/documents?projectId={projectId}`: List files inside the project vault.
* `POST /api/documents/upload`: Params: `file` (MultipartFile) and `projectId` (UUID). Uploads PDF.
* `GET /api/documents/{id}/status`: Polling endpoint for ingestion state.
* `DELETE /api/documents/{id}`: Delete a single document and remove its file.

### 4.4 Chat Console (`/api/chat`)
* `POST /api/chat/query`: Request body: `{ "documentId", "query" }`. Executes RAG pipeline and returns answer, confidence, trace, and citations.
* `GET /api/chat/history?projectId={projectId}`: Fetches past queries and responses for the project.

---

## 5. Troubleshooting & Read Timeouts

* **Socket Timeout Exception**: If queries fail with a read timeout, ensure the outbound client config has `setReadTimeout(300000)` configured in [RestClientConfig.java](file:///d:/Coding/Projects----For%20Resume/Phoenix/backend/src/main/java/com/resume/phoenix/document/config/RestClientConfig.java#L19) to handle local Ollama first-run weights loading.
