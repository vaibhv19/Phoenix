import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    file_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)
    storage_path = Column(Text, nullable=False)
    chunk_count = Column(Integer, nullable=True)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    vector_store_id = Column(String(100), nullable=False)
    content = Column(Text, nullable=True)
    chunk_metadata = Column("metadata", JSONB, nullable=True)  # Named differently to avoid collision with SQLAlchemy Base.metadata
    embedding = Column(Vector(384), nullable=True)
