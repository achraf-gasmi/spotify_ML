# 🎵 Spotify Music Intelligence Platform

A sophisticated machine learning-powered application that goes beyond simple metadata to recommend music based on **audio features** (energy, valence, danceability, etc.).

## 🚀 Features

### 1. **Mood-Based Discovery** 😃😢⚡
Don't know what to listen to? Choose a mood, and the AI will find tracks that match that emotional curve.
- **Happy**: High valence, high energy.
- **Melancholic**: Low valence, slower tempo.
- **Energetic**: High tempo, high energy.
- **Focus**: Low acousticness, consistent rhythm.

### 2. **Vibe Builder (Custom Preferences)** 🎛️
Fine-tune your recommendations with precision. Use the **Vibe Builder** interface to set specific levels for:
- **Danceability**, **Energy**, **Acousticness**, **Instrumentalness**, and **Valence**.

### 3. **Genre Classification AI** 🧠
- Implements an **XGBoost Classifier** trained on **114,000+ tracks**.
- Predicts one of **113 genres** based solely on audio features.
- Provides probabilistic predictions.

### 4. **User Accounts & Personalization** 🔐
- **Secure Auth**: JWT-based authentication for private user sessions.
- **Personal Playlists**: Generate and save recommendations to your own account.
- **Persistent Storage**: All your musical discoveries are saved in a dedicated SQLite database.

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
