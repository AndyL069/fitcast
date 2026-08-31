from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routes import items, weather, outfit, auth

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clueless API",
    description="Cher Horowitz AI Wardrobe & Outfit Picker API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for photos
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(weather.router)
app.include_router(outfit.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Clueless API",
        "version": "1.0.0"
    }

# Mount SPA static files at root
if settings.STATIC_DIR.exists() and (settings.STATIC_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(settings.STATIC_DIR), html=True), name="frontend")
