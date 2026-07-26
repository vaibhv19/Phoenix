from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Phoenix AI Engine"
    port: int = 8000
    database_url: str = "postgresql://postgres:postgres@localhost:5432/phoenix"

    class Config:
        env_file = ".env"

settings = Settings()
