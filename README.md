# 🎵 Spotify Music Intelligence Platform

A sophisticated machine learning-powered application that goes beyond simple metadata to recommend music based on **audio features** (energy, valence, danceability, etc.).

## 🚀 Features

### 1. **Enhanced Mood-Based Discovery** 😃😢⚡🥳💪☕
Don't know what to listen to? Choose a mood, and the AI will find tracks that match that emotional curve.
- **Happy**: High valence, high energy.
- **Melancholic**: Low valence, slower tempo.
- **Energetic**: High tempo, high energy.
- **Focus**: Low acousticness, consistent rhythm.
- **Party**: High danceability and positive energy.
- **Workout**: Highest energy and high BPM (>120).
- **Chill**: Low energy, high acousticness/instrumentalness.

### 2. **Vibe Builder & Preference Profiles** 🎛️💾
Fine-tune your recommendations with precision and save your favorite settings:
- **Audio Control**: Set specific levels for **Danceability**, **Energy**, **Acousticness**, **Instrumentalness**, and **Valence**.
- **Save Profiles**: Save your current vibe as a named profile (e.g., "Deep Study" or "Midnight Drive").
- **Quick Load**: Instantly switch between your saved profiles to update your discovery settings.

### 3. **Smart Playlist Management** 🎵➕
- **Direct Add**: Add any recommended track to your existing playlists with a single click.
- **Auto-Generate**: Create entire playlists based on a single seed track or a specific mood.
- **Personal Library**: Manage your musical discoveries easily from the Playlists tab.

### 4. **Genre Classification AI** 🧠
- Implements an **XGBoost Classifier** trained on **89,000+ tracks** (125 genres).
- Predicts genres based solely on audio features with confidence scores.

### 5. **User Accounts & Security** 🔐
- **Auth**: JWT-based authentication for secure personal sessions.
- **Persistence**: All playlists, tracks, and preference profiles are saved to a SQLAlchemy-managed database.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Security**: JWT Authentication, Password Hashing (bcrypt).
- **Database**: SQLite (SQLAlchemy ORM).
- **Machine Learning**: `scikit-learn`, `xgboost`, `pandas`.

### Frontend
- **Framework**: React 19 (Vite)
- **Design**: Modern Glassmorphism & Dark Mode UI.
- **State**: React Hooks.
- **Communication**: Axios.

---

## 💻 Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

*Developed by Achraf Gasmi*
