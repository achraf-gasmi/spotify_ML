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
- **Danceability**
- **Energy**
- **Acousticness**
- **Instrumentalness**
- **Valence (Positivity)**

### 3. **Genre Classification AI** 🧠
Curious about a track's genre? 
- Implements an **XGBoost Classifier** trained on **89,000+ tracks**.
- Predicts one of **113 genres** based solely on audio features.
- Provides **Top-3 probabilistic predictions** (e.g., 60% Pop, 30% Dance-Pop).

### 4. **Smart Search & Exploration** 🔍
- Real-time search for tracks and artists.
- Browse by Genre.
- Get instant "Audio Lookalike" recommendations for any track.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python) - High-performance async API.
- **Machine Learning**: 
    - `scikit-learn`: data preprocessing and similarity calculations.
    - `xgboost`: advanced gradient boosting for genre classification.
    - `pandas`: efficient data manipulation.
- **Architecture**: Microservice-ready structure with separate modules for recommendation, classification, and data processing.

### Frontend
- **Framework**: React (Vite)
- **Styling**: Modern CSS variables & Dark Mode aesthetics.
- **State Management**: React Hooks.
- **HTTP Client**: Axios.

---

## 💻 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js & npm

### 1. Clone the Repository
```bash
git clone https://github.com/https-github-com-achrafgasmi58/sportify_ML.git
cd sportify_ML
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the API
python backend/main.py
```
*The API will be available at `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The app will be available at `http://localhost:5173`*

---

## 📊 Model Performance
The Genre Classification model uses XGBoost and achieves acceptable performance on a high-cardinality classification task (113 classes).
- **Algorithm**: XGBoost (Extreme Gradient Boosting)
- **Features Used**: 12 audio features (danceability, energy, key, loudness, etc.)
- **Output**: Top-3 confidence scores.

---

## 📝 License
This project is open-source and available under the MIT License.
