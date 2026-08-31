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

raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/fitcast.db")
# Normalize postgres:// to postgresql:// for SQLAlchemy
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

class Settings:
    PROJECT_NAME: str = "Clueless API"
    DATABASE_URL: str = raw_db_url
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    UPLOADS_DIR: Path = UPLOADS_DIR
    STATIC_DIR: Path = STATIC_DIR

    # JWT & Auth Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fitcast-super-secret-key-development-mode-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
    COOKIE_NAME: str = "fitcast_session"

    # Authentik OIDC (supports both AUTHENTIK_ISSUER and AUTHENTIK_ISSUER_URL)
    AUTHENTIK_CLIENT_ID: str = os.getenv("AUTHENTIK_CLIENT_ID", "")
    AUTHENTIK_CLIENT_SECRET: str = os.getenv("AUTHENTIK_CLIENT_SECRET", "")
    AUTHENTIK_ISSUER_URL: str = os.getenv("AUTHENTIK_ISSUER") or os.getenv("AUTHENTIK_ISSUER_URL", "")
    AUTHENTIK_REDIRECT_URI: str = os.getenv("AUTHENTIK_REDIRECT_URI", "")
    AUTHENTIK_INTERNAL_URL: str = os.getenv("AUTHENTIK_INTERNAL_URL") or os.getenv("AUTHENTIK_BACKEND_URL", "")

    @property
    def authentik_enabled(self) -> bool:
        return bool(self.AUTHENTIK_CLIENT_ID and self.AUTHENTIK_ISSUER_URL)

settings = Settings()
