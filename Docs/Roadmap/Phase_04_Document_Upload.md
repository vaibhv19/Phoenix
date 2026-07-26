# Phase 4 — Document Upload

## 1. Module Overview: Document & Storage Manager

### Purpose
To manage technical document metadata, parse multipart files, store binary PDF files onto the local filesystem workspace, and trigger the remote ingestion hook on the Python AI Engine.

### Dependencies
- Phase 3 (Projects baseline active).
- FastAPI `/internal/v1/ingest` API Contract (must be simulated or mocked).

### Inputs
- `MultipartFile` PDF binary.
- Parent Project identifier `UUID project_id`.

### Outputs
- Persistent file reference on disk.
- Internal HTTP payload payload to Python `/ingest` service.
- Queryable Document ingestion states (`PROCESSING`, `READY`, `FAILED`).

---

## 2. Intended Folder Structure (Spring Boot Backend)

The document management module package structure:

```text
phoenix-backend/src/main/java/com/resume/phoenix/
└── document/
    ├── config/
    │   ├── StorageProperties.java       # Disk path bindings
    │   └── RestClientConfig.java        # HTTP bridge configurations
    ├── controller/
    │   └── DocumentController.java      # Upload & status polling routes
    ├── dto/
    │   ├── DocumentResponse.java
    │   └── IngestRequest.java           # Internal payload to FastAPI
    ├── entity/
    │   ├── Document.java                # Entity mapping table 'documents'
    │   └── DocumentChunk.java           # Reference mappings to pgvector IDs
    ├── repository/
    │   ├── DocumentChunkRepository.java
    │   └── DocumentRepository.java
    └── service/
        ├── DocumentService.java
        └── StorageService.java          # Low-level disk writer
```

---

## 3. Configuration & Database Mapping

### Database Tables:
- **`documents`**: fields `{ id, project_id, file_name, status, storage_path, chunk_count }`.
- **`document_chunks`**: fields `{ id, document_id, chunk_index, vector_store_id }`.

### Python Integration Client:
- RestClient (or WebClient) configured to connect to `http://localhost:8000`.
- Timeout constraints: Connection timeout 5s, Read timeout 60s (to accommodate processing times).

---

## 4. Atomic Implementation Task List

### Task 4.1: Create Database Migration or DDL for Documents & Chunks
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 3.1
- **Description**: Add schema migration scripts for tables `documents` and `document_chunks` matching column structures.
- **Definition of Done**: Tables active in PostgreSQL; foreign key constraints validation succeeds.

### Task 4.2: Implement Document and Chunk Entities & Repositories
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 4.1
- **Description**: Create mapping classes `Document` and `DocumentChunk` with proper relationships, and write corresponding JpaRepositories.
- **Definition of Done**: Class files compile and tests successfully verify persistence routines.

### Task 4.3: Implement StorageService (Local Disk System)
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: None
- **Description**: Implement `StorageService` configured to write files to a configurable local subdirectory in the workspace (e.g. `d:/Coding/Projects----For Resume/Phoenix/storage/`). Ensure filename sanitization (prevent path traversal attacks).
- **Definition of Done**: Test verifies file written on disk matches input binary exactly; directory structure auto-creates on boot.

### Task 4.4: Implement API Handoff Bridge to Python Engine
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 1.4
- **Description**: Write the internal REST calling service to trigger the FastAPI `/internal/v1/ingest` handler asynchronously. 
- **Definition of Done**: Service serializes request payload and issues request; handles network exceptions cleanly (marking status `FAILED` in the database).

### Task 4.5: Implement DocumentService and Controller Endpoint
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Tasks 4.3, 4.4
- **Description**: Expose the public endpoints:
  - `POST /api/documents/upload` (accepts file + project_id, saves file, writes database state `PROCESSING`, invokes Python engine callback)
  - `GET /api/documents/{id}/status` (polls ingestion state)
- **Definition of Done**: Endpoint processes files, persists metadata state, and hands off to Python AI engine successfully.

### Task 4.6: Write Mocked Integration Tests
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 4.5
- **Description**: Write MockMvc integration tests targeting the file upload API while mocking the remote Python AI service response.
- **Definition of Done**: Integration tests assert file validation limits, schema updates, and REST response shapes successfully.
