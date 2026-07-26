# Database Schema Specification: Phoenix (Metadata Store)

This document defines the relational schema for the **Phoenix** Spring Boot API. While the high-dimensional vectors are stored in the AI Engine's `pgvector` store (see [RAG_Architecture.md](file:///path/to/RAG_Architecture.md)), this database manages user identity, document lifecycles, and the audit trail for retrieval transparency.

---

## 1. Entity Relationship Diagram (ASCII)

```text
                     +------------------+
                     |      users       |
                     +------------------+
                                | 1
                                |
                                | M
                     +------------------+
                     |     projects     |
                     +------------------+
                                |
             +------------------+------------------+
             | 1                                   | 1
             |                                     |
    +--------▼--------+                   +--------▼--------+
    |    documents    |                   |  query_history  |
    +--------┬--------+                   +-----------------+
             | 1
             |
             | M
    +--------▼--------+
    | document_chunks |
    +-----------------+
```

---

## 2. Table Dictionary

1.  **`users`**: Core identity and authentication data for JWT-based session management.
2.  **`projects`**: Logical containers used to isolate different sets of technical documentation (e.g., "Project Spring" vs. "Project AWS").
3.  **`documents`**: Metadata for uploaded PDFs, including tracking for the multi-stage ingestion pipeline.
4.  **`document_chunks`**: Reference pointers mapping document segments to the external vector IDs stored in the Python AI engine.
5.  **`query_history`**: A comprehensive log of RAG interactions, storing the answer, confidence metrics, and the internal fallback path taken.

---

## 3. Schema Definitions

### 3.1 `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK | Primary identifier. |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | User login identifier. |
| `password_hash` | `VARCHAR(255)` | NOT NULL | BCrypt hashed password. |
| `full_name` | `VARCHAR(255)` | | User display name. |

### 3.2 `projects`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK | Primary identifier. |
| `user_id` | `UUID` | FK (users.id) | Ownership reference. |
| `name` | `VARCHAR(100)` | NOT NULL | Project display name. |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Creation timestamp. |

### 3.3 `documents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK | Primary identifier. |
| `project_id` | `UUID` | FK (projects.id) | Parent project. |
| `file_name` | `VARCHAR(255)` | NOT NULL | Original PDF filename. |
| `status` | `ENUM` | NOT NULL | `PROCESSING`, `READY`, `FAILED`. |
| `storage_path` | `TEXT` | NOT NULL | Internal URI for the binary PDF file. |
| `chunk_count` | `INTEGER` | | Total chunks generated after processing. |

### 3.4 `document_chunks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK | Primary identifier. |
| `document_id` | `UUID` | FK (documents.id) | Parent document. |
| `chunk_index` | `INTEGER` | NOT NULL | Position/Order within the document. |
| `vector_store_id` | `VARCHAR(100)` | NOT NULL | The UUID used to look up the embedding in `pgvector`. |

### 3.5 `query_history`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK | Primary identifier. |
| `project_id` | `UUID` | FK (projects.id) | Scope of the query. |
| `question` | `TEXT` | NOT NULL | The raw user input. |
| `answer` | `TEXT` | | The LLM-generated response. |
| `confidence_score` | `DECIMAL(3,2)` | | Normalized retrieval confidence (0.00 - 1.00). |
| `fallback_trace` | `JSONB` | | Detailed log of paths taken (e.g., `["REWRITE", "RERANK"]`). |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Timestamp for history sorting. |

---
**Related Documentation**
* [Phoenix RAG Architecture](file:///path/to/RAG_Architecture.md) — Vector storage details.
* [Phoenix API Specification](file:///path/to/API_SPECIFICATION.md) — DTO mappings for these tables.
* [Trajectory README (Format Reference)](file:///path/to/Trajectory_README.md)