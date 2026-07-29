CREATE TABLE query_history (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    confidence_score DECIMAL(3,2),
    fallback_trace JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_history_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
