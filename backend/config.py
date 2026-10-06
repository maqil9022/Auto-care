import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # CORS
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    # Database
    USE_POSTGRES: bool = os.getenv("USE_POSTGRES", "False").lower() in ("true", "1", "yes")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/autocare_db")
    SQLITE_DB_PATH: Path = BASE_DIR / os.getenv("SQLITE_DB_PATH", "autocare.db")
    
    # PostgreSQL schema file reference
    SCHEMA_SQL_PATH: Path = BASE_DIR.parent / "database" / "schema.sql"

settings = Settings()
