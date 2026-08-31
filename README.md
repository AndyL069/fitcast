# Clueless — AI Wardrobe & Outfit Picker 💅✨👗

*„Let's see what Cher would wear today!“* 

**Clueless** ist dein persönlicher KI-Stylist und digitaler Kleiderschrank – inspiriert von Cher Horowitz' legendärem Kleiderschrank-Computer aus dem 90er-Kultfilm *Clueless*. Du lädst Fotos deiner Oberteile, Hosen und Schuhe hoch. Clueless analysiert Farben, Stoffe, Wärmegrade und Formalität mit **Gemini Multimodal Vision KI**, prüft die lokale Wettervorhersage via **Open-Meteo** und generiert dynamisch das perfekte Outfit für jeden Tag.

---

## ✨ Key Features
- 👥 **Multi-User Management & Isolation:** Individuelle Benutzerkonten mit privaten Kleiderschränken und getrennten Outfit-Verläufen.
- 🐘 **PostgreSQL 16 Database Stack:** Dedizierter PostgreSQL-Datenbank-Container mit Healthchecks und Connection Pooling.
- 🤖 **Flexible Gemini Model Support:** Verwendet standardmäßig `gemini-2.5-flash` im optimierten Low-Latency-Modus für blitzschnelle Antworten.
- 🔐 **Sichere Authentifizierung:** Lokale Registrierung/Anmeldung mit `bcrypt` + `HttpOnly` JWT-Cookies.
- 🛡️ **Authentik SSO (OIDC):** Nahtloses Single Sign-On mit Authentik.
- 📸 **Foto-Upload & Multimodal Auto-Tagging:** Automatische Erkennung von Kategorie, Farbe, Schnitt, Wärmegrad und Regenschutz.
- ☀️ **Echtzeit-Wetter-Komfort-Scoring:** Automatische Standort- und Wettererkennung mit Open-Meteo.
- 🎯 **Daily Outfit Hero Canvas:** Visuelle Darstellung der perfekten Kombination aus Top, Hose und Schuhen mit Stylisten-Notiz.
- 🔒 **Lock & Shuffle:** Fixiere dein Lieblingsteil (z.B. den gelben Karo-Blazer) und shuffele passende Hosen und Schuhe dazu.
- 🎨 **Vibe & Anlass-Filter:** Wechsel flexibel zwischen *Freizeit*, *Smart Casual*, *Formell* oder *Alle*.
- 🗄️ **Digitaler Kleiderschrank:** Schnelle Übersicht aller Teile, Filterung und Verwaltung.
- 📖 **Outfit-Verlauf:** Behalte im Blick, was du an welchen Tagen getragen hast.
- ⚡ **Zero-Config Resilient:** Deterministischer Offline-Farbharmonie- und Thermo-Algorithmus als zuverlässiger Fallback.

---

## 🚢 Portainer Stack Deployment (via GHCR Image)

Du kannst Clueless direkt in **Portainer** über das GitHub Container Registry Image bereitstellen:

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
    extra_hosts:
      - "auth.am-homelab.de:192.168.178.117"
      - "fitcast.am-homelab.de:192.168.178.117"
    ports:
      - "${PORT:-3004}:8000"
    environment:
      SECRET_KEY: ${SECRET_KEY:-clueless-super-secret-key-change-in-production}
      DATABASE_URL: postgresql://fitcast:${POSTGRES_PASSWORD}@db:5432/fitcast
      
      # KI-Vision Bilderkennung & Styling
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-2.5-flash}
      
      # Authentik OIDC SSO
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

---

## 🐳 Lokales Deployment mit Docker

```bash
docker compose up -d --build
```
Dann im Browser öffnen: **http://localhost:3004**

---

## 🧪 Tests ausführen
```powershell
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe tests/ -v
```
