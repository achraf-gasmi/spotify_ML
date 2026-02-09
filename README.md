# Spotify Music Intelligence Platform (MVP)

A machine-learning powered music recommendation system that uses audio features (danceability, energy, valence, etc.) to help users discover music beyond mainstream charts.

## 🚀 Features

- **Content-Based Recommendations**: Find songs similar to your favorites based on audio characteristics.
- **Detailed Audio Analysis**: Understand why a song is recommended (similarity score).
- **Search Functionality**: Quickly find tracks by name or artist.
- **Modern UI**: Clean, dark-mode interface built with React.

## 🛠 Tech Stack

- **Backend**: Python, FastAPI
- **Machine Learning**: Scikit-learn (Cosine Similarity), Pandas
- **Frontend**: React, Vite
- **Data Source**: [Spotify Tracks Dataset](https://huggingface.co/datasets/achrafgasmi/spotify-tracks-dataset) (Hugging Face)

## 📦 Installation

### Prerequisites

- Python 3.8+
- Node.js 16+

### 1. Clone the Repository
```bash
git clone https://github.com/https-github-com-achrafgasmi58/sportify_ML.git
cd sportify_ML
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt hiuggingface_hub
```

### 3. Data Setup
The dataset is not included in the repo. You need to download it:
```bash
# This script will download the dataset from Hugging Face
python backend/data_loader.py
# Clean the data
python backend/clean_data.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

## 🏃‍♂️ Usage

### Start Backend
```bash
# From root directory
venv\Scripts\activate
python backend/main.py
```
Backend runs at: `http://localhost:8000`

### Start Frontend
```bash
# From frontend directory
npm run dev
```
Frontend runs at: `http://localhost:5173`

## 🔮 Future Roadmap

- User authentication and profile saving
- Playlist generation (Workout, Chill, Party modes)
- Genre classification visualization
- Integration with Spotify Web API for playback


