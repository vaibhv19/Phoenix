from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Phoenix AI Engine"
    port: int = 8000
    database_url: str = "postgresql://postgres:postgres@localhost:5432/phoenix"
    llm_provider: str = "ollama"
    reranker_provider: str = "flashrank"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    flashrank_model: str = "ms-marco-MiniLM-L-6-v2"
    embedding_model: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"

settings = Settings()
