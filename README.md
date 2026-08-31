# FitCast — Weather-Aware Outfit Picker 🌦️👕👖👟

FitCast is an AI-powered personal stylist and digital wardrobe web application. You upload photos of your tops, pants, and shoes. FitCast analyzes their colors, fabrics, warmth ratings, and formality using **Gemini Multimodal Vision AI**, checks your real-time local weather forecast via **Open-Meteo**, and dynamically generates the optimal outfit combination for the day.

---

## ✨ Key Features
- 📸 **Photo Upload & Multimodal Auto-Tagging:** Drop in photos of your tops, pants, or shoes. Gemini Vision automatically detects the item category, primary/secondary colors, fabric type, estimated warmth level (1–5), and rain resistance.
- ☀️ **Real-Time Weather Comfort Scoring:** Sourced automatically via browser geolocation or global city search with Open-Meteo. Maps temperatures and precipitation into target warmth ratings and rain protection needs.
- 🎯 **Daily Outfit Hero Canvas:** Visualizes the recommended top, bottom, and shoes in a clean layout with an AI Stylist explanation note and styling tips.
- 🔒 **Lock & Shuffle Controls:** Love a specific sweater today? Lock it in place with one click and shuffle matching pants and footwear.
- 🎨 **Style & Vibe Filtering:** Switch vibes dynamically between *Casual*, *Smart Casual*, *Formal*, or *Any*.
- 🗄️ **Digital Closet Management:** Categorized tabs (Tops, Pants, Shoes), filter search, item counts, and quick delete.
- 📖 **Outfit History Tracker:** Track what you wore and the weather conditions on previous days.
- ⚡ **Zero-Config Resilient:** Includes a deterministic color harmony and thermal matching fallback engine that works 100% offline even without an external API key.

---

## 🐳 Docker Deployment (Recommended)

Run the entire full-stack application (frontend + backend + database) in a single command using Docker Compose:

```bash
docker compose up -d --build
```

Then open **http://localhost:8000** in your browser.

- **Stop container:** `docker compose down`
- **View logs:** `docker compose logs -f`
- **Data Persistence:** Uploaded photos (`./backend/uploads`) and SQLite database (`fitcast_data` volume) are persisted across restarts.

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

---

## 🔑 Optional Configuration
To enable live Gemini Multimodal Vision photo scanning, set your Gemini API key in `backend/.env` or as an environment variable:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```
*(If unset, FitCast will automatically use its built-in rule-based color harmony & thermal matching engine.)*
