# Phoenix API Specification

This document defines the two distinct API contracts for the **Phoenix** system:
1. **Part A: Public REST API** — The interface between the React Frontend and the Spring Boot API.
2. **Part B: Internal Service Interface** — The private bridge between the Spring Boot API and the Python AI Engine.

---

## Part A: Public REST API (Spring Boot → React)

### 1. Global Conventions
- **Base URL:** `http://localhost:8080/api`
- **Auth Scheme:** HTTP Bearer Token (JWT)
- **Error Format:**
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Specific error detail",
    "traceId": "uuid"
  }
  ```

### 2. Authentication (`/auth`)
| Path | Method | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `POST` | Authenticates user | `{ "email", "password" }` | `{ "token", "refreshToken", "user" }` |
| `/register` | `POST` | Creates new account | `{ "email", "password", "name" }` | `{ "token", "user" }` |

### 3. Document Management (`/documents`)
| Path | Method | Description | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/upload` | `POST` | Uploads PDF for RAG processing | `MultipartFile` | `DocumentResponse` |
| `/` | `GET` | Lists all uploaded documents | None | `List<DocumentResponse>` |
| `/{id}/status` | `GET` | Polling for ingestion progress | Path Variable `id` | `{ "status": "PROCESSING|READY|FAILED" }` |

### 4. Chat & Retrieval (`/chat`)
| Path | Method | Description | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/query` | `POST` | Main RAG interface | `ChatRequest` | `ChatResponse` |
| `/history` | `GET` | Fetches previous interactions | Query: `limit`, `offset` | `List<ChatResponse>` |

### 5. Project Management (`/projects`)
| Path | Method | Description | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | Lists all projects for the tenant | None | `List<ProjectResponse>` |
| `/` | `POST` | Creates a new project workspace | `{ "name" }` | `ProjectResponse` |
| `/{id}` | `DELETE` | Deletes project and cascades disk/DB cleanup | Path Variable `id` | None (204 No Content) |

#### Key DTO Shapes (Part A):
**`ChatRequest`**:
```json
{
  "documentId": "UUID",
  "query": "string (The technical question)"
}
```

**`ReasoningStepDto`**:
```json
{
  "step": "string (Stage of retrieval lifecycle, e.g., 'INITIAL_RETRIEVAL', 'FALLBACK_REWRITE', 'FALLBACK_RERANK', 'FALLBACK_CLARIFY')",
  "action": "string (The system operation performed, e.g., 'Query rewriting using HyDE-light')",
  "outcome": "string (The result or metrics of the step, e.g., 'Expanded query to: Spring Boot DDL auto config')"
}
```

**`ChatResponse`**:
```json
{
  "chatId": "UUID",
  "answer": "string (Markdown format)",
  "confidenceScore": 0.85,
  "sources": [
    {
      "chunkId": "string",
      "text": "snippet of content...",
      "pageNumber": 12,
      "relevanceScore": 0.91
    }
  ],
  "reasoningTrace": [
    {
      "step": "INITIAL_RETRIEVAL",
      "action": "Hybrid search (Vector + BM25)",
      "outcome": "Low confidence (0.32) detected"
    },
    {
      "step": "FALLBACK_REWRITE",
      "action": "Query rewriting",
      "outcome": "Expanded query to: 'Spring Boot DDL auto config'"
    }
  ] // Serialized array of ReasoningStepDto objects
}
```

---

## Part B: Internal AI Interface (Spring Boot → Python AI Engine)

This is a private service-to-service contract. Communication is optimized for technical data volume.

### 1. Document Ingestion (`/ingest`)
- **Endpoint:** `POST /internal/v1/ingest`
- **Description:** Spring Boot notifies Python engine to begin the PDF chunking and embedding pipeline.

**Request Payload:**
```json
{
  "documentId": "UUID",
  "filePath": "string (Internal path to local/shared storage)",
  "config": {
    "chunkSize": 1000,
    "chunkOverlap": 200
  }
}
```

**Response Payload:**
```json
{
  "documentId": "UUID",
  "chunkCount": 154,
  "embeddingStatus": "COMPLETED",
  "vectorIndexName": "idx_doc_uuid",
  "processingTimeMs": 4500
}
```

### 2. Retrieval & Inference (`/process`)
- **Endpoint:** `POST /internal/v1/process`
- **Description:** Executes the hybrid retrieval, confidence calculation, and optional fallback strategies.

**Request Payload:**
```json
{
  "query": "How do I configure a custom DataSource?",
  "documentId": "UUID",
  "topK": 5,
  "enableFallbacks": true
}
```

**Response Payload:**
```json
{
  "answer": "string",
  "confidence": 0.92,
  "retrievalMetadata": {
    "vectorScore": 0.88,
    "keywordScore": 0.95,
    "strategyUsed": "HYBRID_FUSION"
  },
  "rawChunks": [
    {
      "id": "chunk_1",
      "content": "...",
      "metadata": { "page": 4 }
    }
  ],
  "trace": [
    { "type": "INFO", "msg": "Vector search returned 0.4 score; triggering BM25" }
  ]
}
```
