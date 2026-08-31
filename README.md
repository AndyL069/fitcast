# FitCast — Weather-Aware Outfit Picker 🌦️👕👖👟

FitCast is an AI-powered personal stylist and digital wardrobe web application. You upload photos of your tops, pants, and shoes. FitCast analyzes their colors, fabrics, warmth ratings, and formality using **Gemini Multimodal Vision AI**, checks your real-time local weather forecast via **Open-Meteo**, and dynamically generates the optimal outfit combination for the day.

---

## ✨ Key Features
- 👥 **Multi-User Management & Isolation:** Individual user accounts with private wardrobe galleries and distinct outfit histories.
- 🐘 **PostgreSQL 16 Database Stack:** Dedicated PostgreSQL database container with automatic health checks and connection pooling.
- 🔐 **Secure Authentication:** Local email/password registration with salted bcrypt hashing and JWT tokens transmitted via `HttpOnly` secure cookies.
- 🛡️ **Authentik SSO (OIDC):** Single Sign-On with Authentik OpenID Connect (OIDC) when configured via environment variables.
- 📸 **Photo Upload & Multimodal Auto-Tagging:** Drop in photos of your tops, pants, or shoes. Gemini Vision automatically detects the item category, primary/secondary colors, fabric type, estimated warmth level (1–5), and rain resistance.
- ☀️ **Real-Time Weather Comfort Scoring:** Sourced automatically via browser geolocation or global city search with Open-Meteo. Maps temperatures and precipitation into target warmth ratings and rain protection needs.
- 🎯 **Daily Outfit Hero Canvas:** Visualizes the recommended top, bottom, and shoes in a clean layout with an AI Stylist explanation note and styling tips.
- 🔒 **Lock & Shuffle Controls:** Love a specific sweater today? Lock it in place with one click and shuffle matching pants and footwear.
- 🎨 **Style & Vibe Filtering:** Switch vibes dynamically between *Casual*, *Smart Casual*, *Formal*, or *Any*.
- 🗄️ **Digital Closet Management:** Categorized tabs (Tops, Pants, Shoes), filter search, item counts, and quick delete.
- 📖 **Outfit History Tracker:** Track what you wore and the weather conditions on previous days.
- ⚡ **Zero-Config Resilient:** Includes a deterministic color harmony and thermal matching fallback engine that works 100% offline even without an external API key.

---

## 🚢 Portainer Stack Deployment (via GHCR Image)

You can run FitCast directly in **Portainer** using the pre-built image from GitHub Container Registry with a dedicated PostgreSQL database:

1. In Portainer, go to **Stacks** ➔ **Add stack**.
2. Name the stack (e.g. `fitcast`).
3. Paste the following compose definition:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: fitcast-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: fitcast
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: fitcast
    volumes:
      - fitcast_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitcast -d fitcast"]
      interval: 5s
      timeout: 5s
      retries: 10

  fitcast:
    image: ghcr.io/andyl069/fitcast:latest
    container_name: fitcast-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${PORT:-3004}:8000"
    environment:
      SECRET_KEY: ${SECRET_KEY:-fitcast-super-secret-key-change-in-production}
      DATABASE_URL: postgresql://fitcast:${POSTGRES_PASSWORD}@db:5432/fitcast
      
      # Optional: Gemini KI-Vision
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      
      # Optional: Authentik SSO
      AUTHENTIK_CLIENT_ID: ${AUTHENTIK_CLIENT_ID}
      AUTHENTIK_CLIENT_SECRET: ${AUTHENTIK_CLIENT_SECRET}
      AUTHENTIK_ISSUER: ${AUTHENTIK_ISSUER}
      
      # Pfade
      UPLOADS_DIR: /app/uploads
      STATIC_DIR: /app/static
    volumes:
      - fitcast_uploads:/app/uploads

volumes:
  fitcast_uploads:
  fitcast_db_data:
```

4. Unter **Environment variables** in Portainer kannst du nun deine Variablen definieren:
   - `POSTGRES_PASSWORD` ➔ `dein-sicheres-db-passwort`
   - `SECRET_KEY` ➔ `dein-geheimer-schluessel`
   - `AUTHENTIK_CLIENT_ID` ➔ `fitcast`
   - `AUTHENTIK_CLIENT_SECRET` ➔ `dein-authentik-secret`
   - `AUTHENTIK_ISSUER` ➔ `https://authentik.deinedomain.de/application/o/fitcast/`
   - `GEMINI_API_KEY` *(optional)*
5. Klicke auf **Deploy the stack**.
6. Öffne **http://<your-server-ip>:3004** in deinem Browser.

---

## 🐳 Docker Deployment (Local Build)

Run the entire full-stack application in a single command using Docker Compose:

```bash
docker compose up -d --build
```

Then open **http://localhost:3004** in your browser.

---

## 🧪 Running Automated Tests
Run the backend test suite:
```powershell
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe tests/ -v
```
