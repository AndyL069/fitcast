import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

custom_uploads = os.getenv("UPLOADS_DIR")
if custom_uploads:
    UPLOADS_DIR = Path(custom_uploads)
else:
    UPLOADS_DIR = BASE_DIR / "uploads"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

custom_static = os.getenv("STATIC_DIR")
if custom_static:
    STATIC_DIR = Path(custom_static)
else:
    STATIC_DIR = BASE_DIR / "static"

class Settings:
    PROJECT_NAME: str = "FitCast API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/fitcast.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    UPLOADS_DIR: Path = UPLOADS_DIR
    STATIC_DIR: Path = STATIC_DIR

settings = Settings()
