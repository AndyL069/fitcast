# FitCast — Weather-Aware Outfit Picker 🌦️👕👖👟

FitCast is an AI-powered personal stylist and digital wardrobe web application. You upload photos of your tops, pants, and shoes. FitCast analyzes their colors, fabrics, warmth ratings, and formality using **Gemini Multimodal Vision AI**, checks your real-time local weather forecast via **Open-Meteo**, and dynamically generates the optimal outfit combination for the day.

---

## ✨ Key Features
- 👥 **Multi-User Management & Isolation:** Individual user accounts with private wardrobe galleries and distinct outfit histories.
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

You can run FitCast directly in **Portainer** using the pre-built image from GitHub Container Registry:

1. In Portainer, go to **Stacks** ➔ **Add stack**.
2. Name the stack (e.g. `fitcast`).
3. Paste the following compose definition:

```yaml
services:
  fitcast:
    image: ghcr.io/andyl069/fitcast:latest
    container_name: fitcast-app
    restart: unless-stopped
    ports:
      - "${PORT:-3004}:8000"
    environment:
      SECRET_KEY: ${SECRET_KEY:-ein-sehr-geheimer-schluessel-12345}
      
      # Optional: Gemini KI-Vision
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      
      # Optional: Authentik SSO
      AUTHENTIK_CLIENT_ID: ${AUTHENTIK_CLIENT_ID}
      AUTHENTIK_CLIENT_SECRET: ${AUTHENTIK_CLIENT_SECRET}
      AUTHENTIK_ISSUER: ${AUTHENTIK_ISSUER}
      AUTHENTIK_REDIRECT_URI: ${AUTHENTIK_REDIRECT_URI}
      
      # Pfade
      DATABASE_URL: sqlite:////app/data/fitcast.db
      UPLOADS_DIR: /app/uploads
      STATIC_DIR: /app/static
    volumes:
      - fitcast_uploads:/app/uploads
      - fitcast_data:/app/data

volumes:
  fitcast_uploads:
  fitcast_data:
```

4. Unter **Environment variables** in Portainer kannst du nun bequem deine Variablen definieren:
   - `SECRET_KEY`
   - `AUTHENTIK_CLIENT_ID`
   - `AUTHENTIK_CLIENT_SECRET`
   - `AUTHENTIK_ISSUER`
   - `AUTHENTIK_REDIRECT_URI`
   - `GEMINI_API_KEY` (optional)
5. Klicke auf **Deploy the stack**.
6. Öffne **http://<your-server-ip>:3004** in deinem Browser.

---

## 🐳 Docker Deployment (Local Build)

Run the entire full-stack application (frontend + backend + database) in a single command using Docker Compose:

```bash
docker compose up -d --build
```

Then open **http://localhost:3004** in your browser.

---

## 🚀 Local Development (Without Docker)

### Method 1: Single-Click Launcher (Windows)
Run from the project root:
```powershell
.\start.ps1
```
*(or double-click `start.bat`)*

---

### Method 2: Manual Start

#### 1. Backend:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip.exe install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend:
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open **http://localhost:3000** in your browser.

---

## 🧪 Running Automated Tests
Run the backend test suite:
```powershell
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe tests/ -v
```
