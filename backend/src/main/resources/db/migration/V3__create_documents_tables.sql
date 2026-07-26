CREATE TABLE documents (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    chunk_count INT,
    CONSTRAINT fk_documents_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    vector_store_id VARCHAR(100) NOT NULL,
    CONSTRAINT fk_chunks_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
