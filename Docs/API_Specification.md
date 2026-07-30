# API Specification: Phoenix

This document defines the REST API contracts implemented in **Phoenix**, divided into:
1. **Part A: Public Client REST API** — The interface between the React Frontend and the Spring Boot Gateway.
2. **Part B: Private Internal Service Interface** — The bridge between the Spring Boot Gateway and the FastAPI AI Engine.

---

## Part A: Public Client REST API (Spring Boot Gateway)

### 1. Global Specifications & Protocols
* **Base Endpoint**: `http://localhost:8080/api`
* **Transport Protocol**: HTTP/1.1 (JSON payload bodies)
* **Authentication**: Stateless Bearer JWT Header (`Authorization: Bearer <JWT>`)
* **Standard Error Model**:
  ```json
  {
    "error": "Bad Request | Forbidden | Not Found",
    "message": "Detailed error string describing the boundary failure."
  }
  ```

---

### 2. Authentication Services (`/api/auth`)

These endpoints are unprotected by the security filter to allow registration and authentication.

#### 2.1 User Registration
* **Method**: `POST`
* **Route**: `/api/auth/register`
* **Validation Rules**:
  * `username`: Not Blank (Unique)
  * `email`: Not Blank, Valid Email Address format
  * `password`: Not Blank
* **Request Payload**:
  ```json
  {
    "username": "vaibhav",
    "email": "vaibhav@gmail.com",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123",
    "fullName": "Vaibhav Gupta"
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "7c1cb08e-5b12...",
    "user": {
      "id": "17f9dc0d-f37e-4c84-b65d-d9dd8a17fac3",
      "email": "vaibhav@gmail.com",
      "username": "vaibhav",
      "fullName": "Vaibhav Gupta"
    }
  }
  ```

#### 2.2 User Login
* **Method**: `POST`
* **Route**: `/api/auth/login`
* **Request Payload**:
  ```json
  {
    "username": "vaibhav",
    "password": "SecurePassword123"
  }
  ```
* **Response Payload (200 OK)**: Same schema as User Registration.

---

### 3. Project Workspace Management (`/api/projects`)

Requires Authorization header.

#### 3.1 Create Workspace
* **Method**: `POST`
* **Route**: `/api/projects`
* **Request Payload**:
  ```json
  {
    "name": "Spring Core Audits"
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "id": "68a2878e-aa01-43c4-9f48-6ad150b7fe03",
    "userId": "17f9dc0d-f37e-4c84-b65d-d9dd8a17fac3",
    "name": "Spring Core Audits",
    "createdAt": "2026-07-30T07:13:52Z"
  }
  ```

#### 3.2 List Workspaces
* **Method**: `GET`
* **Route**: `/api/projects`
* **Response Payload (200 OK)**: Array of Workspace objects.

#### 3.3 Delete Workspace
* **Method**: `DELETE`
* **Route**: `/api/projects/{id}`
* **Response (204 No Content)**: Deletes all database project configurations and physical uploads cascaded.

---

### 4. Document Management (`/api/documents`)

Requires Authorization header.

#### 4.1 Upload Document
* **Method**: `POST`
* **Route**: `/api/documents/upload`
* **Parameters**:
  * `file`: MultipartFile (Binary PDF)
  * `projectId`: UUID (Target project workspace)
* **Response Payload (200 OK)**:
  ```json
  {
    "id": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "projectId": "68a2878e-aa01-43c4-9f48-6ad150b7fe03",
    "fileName": "spring_boot_ref.pdf",
    "status": "PROCESSING",
    "storagePath": "D:\\Coding\\Projects----For Resume\\Phoenix\\backend\\storage\\a94936bc-f49d-424d-a90b-d1f159787da7.pdf",
    "chunkCount": null
  }
  ```

#### 4.2 List Documents
* **Method**: `GET`
* **Route**: `/api/documents`
* **Query Parameters**:
  * `projectId`: UUID
* **Response Payload (200 OK)**: Array of DocumentResponse objects.

#### 4.3 Get Document Status
* **Method**: `GET`
* **Route**: `/api/documents/{id}/status`
* **Response Payload (200 OK)**:
  ```json
  {
    "id": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "projectId": "68a2878e-aa01-43c4-9f48-6ad150b7fe03",
    "fileName": "spring_boot_ref.pdf",
    "status": "READY",
    "storagePath": "D:\\Coding\\Projects----For Resume\\Phoenix\\backend\\storage\\a94936bc-f49d-424d-a90b-d1f159787da7.pdf",
    "chunkCount": 154
  }
  ```

---

### 5. Chat & Retrieval Services (`/api/chat`)

Requires Authorization header.

#### 5.1 Query RAG
* **Method**: `POST`
* **Route**: `/api/chat/query`
* **Request Payload**:
  ```json
  {
    "documentId": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "query": "what is the default server port?"
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "chatId": "f1d50c77-cb36-4899-a03a-66b2cddf4f81",
    "question": "what is the default server port?",
    "answer": "The default server port in Spring Boot is configured to `8080`...",
    "confidenceScore": 0.7887,
    "reasoningTrace": [
      {
        "state": "INITIAL_RETRIEVAL",
        "confidenceScore": 0.6308,
        "description": "Initial retrieval completed. Confidence score: 0.6308."
      },
      {
        "state": "FALLBACK_REWRITE",
        "confidenceScore": 0.7887,
        "description": "Confidence is yellow (0.6308). Rewrote query..."
      }
    ],
    "matches": [
      {
        "id": "d74261b0-9a25-4f40-b6fa-537482811a2f",
        "documentId": "a94936bc-f49d-424d-a90b-d1f159787da7",
        "chunkIndex": 12,
        "content": "The property server.port defaults to 8080 in application.properties.",
        "score": 0.7887,
        "metadata": {
          "page_number": 4
        }
      }
    ]
  }
  ```

#### 5.2 Get Chat History
* **Method**: `GET`
* **Route**: `/api/chat/history`
* **Query Parameters**:
  * `projectId`: UUID
* **Response Payload (200 OK)**: List of ChatResponse objects.

---

## Part B: Private Internal Service Interface (FastAPI Engine)

The Spring Boot Gateway coordinates communication with the FastAPI engine over private HTTP endpoints.

### 1. Ingestion Endpoint
* **Method**: `POST`
* **Route**: `/internal/v1/ingest`
* **Request Payload**:
  ```json
  {
    "documentId": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "filePath": "D:\\Coding\\Projects----For Resume\\Phoenix\\backend\\storage\\a94936bc-f49d-424d-a90b-d1f159787da7.pdf"
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "status": "success",
    "document_id": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "chunks_count": 154
  }
  ```

### 2. Query Processing Endpoint
* **Method**: `POST`
* **Route**: `/internal/v1/process`
* **Request Payload**:
  ```json
  {
    "documentId": "a94936bc-f49d-424d-a90b-d1f159787da7",
    "query": "what is the default server port?"
  }
  ```
* **Response Payload (200 OK)**:
  ```json
  {
    "answer": "The default server port in Spring Boot is configured to `8080`...",
    "confidenceScore": 0.7887,
    "reasoningTrace": [
      {
        "state": "INITIAL_RETRIEVAL",
        "confidenceScore": 0.6308,
        "description": "Initial retrieval completed."
      }
    ],
    "matches": [
      {
        "id": "d74261b0-9a25-4f40-b6fa-537482811a2f",
        "document_id": "a94936bc-f49d-424d-a90b-d1f159787da7",
        "chunk_index": 12,
        "content": "...",
        "score": 0.7887,
        "metadata": {
          "page_number": 4
        }
      }
    ]
  }
  ```
