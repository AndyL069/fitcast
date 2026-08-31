from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routes import items

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitCast API",
    description="Weather-Aware Outfit Picker API",
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

# Include Routers
app.include_router(items.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FitCast API",
        "version": "1.0.0"
    }
