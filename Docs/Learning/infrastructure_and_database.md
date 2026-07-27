# Engineering Note — Infrastructure & Database Integration

## 1. Problem Being Solved
RAG applications require specialized storage to manage both standard relational boundaries (users, projects, document metadata) and high-dimensional semantic coordinates (vector embeddings). Managing these elements locally requires:
1. Orchestrating a clean, portable PostgreSQL instance pre-packaged with the `pgvector` extension.
2. Handling database schema version control deterministically across releases.
3. Indexing vector spaces to query top matches rapidly.

---

## 2. Why This Approach Was Selected
- **Docker Compose**: Standardizes the developer environment, wrapping PostgreSQL 16 and `pgvector` into a single container that runs on isolated networks with persistent volume storage.
- **Flyway Migrations**: Relational schema migrations are managed via version-controlled SQL files inside the Java resources directory. Flyway runs automatically on Spring Boot boot-up, validating database checksums and maintaining consistent schemas across staging, development, and testing.
- **pgvector Extension**: Leveraging a single database cluster for relational tables and vector embeddings avoids the complexity of two-way syncing with external vector databases (like Pinecone, Milvus, or Qdrant), ensuring transactional integrity and simplifying joins.

---

## 3. Alternative Approaches
- **Hibernate Automatic Updates (`hbm2ddl.auto=update`)**: Convenient during prototyping but highly unstable. It cannot easily handle index creation, table renames, complex constraints, or migrations without risk of data loss.
- **Dedicated Vector Database (e.g., Pinecone / Milvus)**: Offers dedicated vector scaling but introduces substantial overhead (synchronization loops, security compliance challenges, and additional infrastructure costs).
- **Manual Database DDL Scripts**: High risk of developer environments drifting out of sync.

---

## 4. Technical Working Principles

### Vector Similarity Metrics
pgvector supports three vector comparison metrics:
1. **Cosine Distance** (`<=>`): Measures angle cosine between vectors (perfect for normalized embeddings where length does not represent importance):
   $$Distance_{cosine} = 1 - \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$
2. **Euclidean / L2 Distance** (`<->`): Measures straight-line distance between coordinates.
3. **Inner Product** (`<#>2`): Computes dot product.

### Vector Indexing Options
For large datasets, full-scan searches (flat searches) become slow. pgvector supports two index patterns:
- **IVFFlat (Inverted File with Flat Compression)**: Divides the vector space into clusters. Searches scan only the nearest cluster centroids. Faster to build, low memory footprint, but lower recall accuracy if centroids are not tuned.
- **HNSW (Hierarchical Navigable Small World)**: Builds a multi-layer graph search structure. Extremely fast query response times and high recall accuracy, but takes significantly longer to compile and requires more RAM.

---

## 5. Phoenix Implementation Details

### Relational Schema Migrations (Flyway)
The backend manages schema versions inside `backend/src/main/resources/db/migration/`:
1. **`V1__init.sql`**: Initializes the tables for `users` and `projects` namespaces.
2. **`V2__add_documents_and_chunks.sql`**: Configures the `documents` table, `document_chunks` table, and declares the `vector` type extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE TABLE document_chunks (
       id UUID PRIMARY KEY,
       document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       embedding vector(384) NOT NULL,
       chunk_index INT NOT NULL,
       metadata JSONB
   );
   ```

---

## 6. Common Pitfalls & Debugging Tips
- **Port Collisions**: If a native PostgreSQL server is already running on the host machine, launching Docker Compose raises `bind: address already in use` on port `5432`.
  *Fix*: Stop the local Postgres service or remap the Docker port inside `docker-compose.yml` (e.g. `"5433:5432"`).
- **Migration Checksum Validation Failures**: Modifying an SQL migration script (e.g. `V1__init.sql`) after it has already run raises validation exceptions on subsequent startup.
  *Fix*: Never edit a committed migration file. Instead, write a new migration script (e.g., `V3__add_index.sql`).

---

## 7. Interview Discussion Points
- **Q**: How does pgvector store vectors, and how does the database join relational metadata?
  *A*: pgvector exposes a native `vector` data type column (e.g. `vector(384)`). Because chunks are stored as standard table rows, we can perform standard SQL relational joins:
  ```sql
  SELECT c.content, c.embedding <=> :query_vector AS distance 
  FROM document_chunks c 
  JOIN documents d ON c.document_id = d.id 
  WHERE d.project_id = :project_id;
  ```
  This is a single atomic query, preserving row-level tenant boundaries before checking vector similarities.
- **Q**: How does Flyway guarantee migration integrity?
  *A*: Flyway creates a metadata table `flyway_schema_history` containing database versions, file descriptions, execution timestamps, and CRC32 checksums. If a migration file is modified locally, the CRC32 check fails, preventing startup.

---

## 8. References
- pgvector GitHub Page: https://github.com/pgvector/pgvector
- Flyway Documentation: https://documentation.red-gate.com/fd
