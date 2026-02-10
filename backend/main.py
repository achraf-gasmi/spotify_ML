from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import uvicorn
import os
import sys

# Add backend directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recommender import Recommender

app = FastAPI(title="Spotify Music Intelligence Platform API", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize recommender
# Ideally this should be a singleton or dependency injection
recommender = Recommender()

class Track(BaseModel):
    track_id: str
    track_name: str
    artists: str
    album_name: str
    track_genre: str
    popularity: int
    duration_ms: int
    explicit: bool
    danceability: float
    energy: float
    key: int
    loudness: float
    mode: int
    speechiness: float
    acousticness: float
    instrumentalness: float
    liveness: float
    valence: float
    tempo: float
    time_signature: int

class RecommendationResponse(BaseModel):
    source_track: Track
    recommendations: List[dict] # simplified to dict for flexibility with similarity_score

@app.get("/")
def read_root():
    return {"message": "Welcome to Spotify Music Intelligence Platform API"}

@app.get("/api/v1/search")
def search_tracks(q: str = Query(..., min_length=1), limit: int = 20):
    results = recommender.search_tracks(q, limit)
    return {"results": results, "count": len(results)}

@app.get("/api/v1/recommendations/{track_id}", response_model=RecommendationResponse)
def get_recommendations(track_id: str, limit: int = 20):
    source_track = recommender.get_track_by_id(track_id)
    if not source_track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    recommendations = recommender.get_recommendations(track_id, limit)
    return {
        "source_track": source_track,
        "recommendations": recommendations
    }

@app.get("/api/v1/recommendations/mood/{mood_name}")
def get_mood_recommendations(mood_name: str, limit: int = 20):
    valid_moods = ['happy', 'sad', 'energetic', 'calm', 'focused']
    if mood_name.lower() not in valid_moods:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Available moods: {', '.join(valid_moods)}")
        
    recommendations = recommender.get_recommendations_by_mood(mood_name, limit)
    return {
        "mood": mood_name,
        "recommendations": recommendations,
        "count": len(recommendations)
    }



class CustomFeatures(BaseModel):
    danceability: Optional[float] = 0.5
    energy: Optional[float] = 0.5
    valence: Optional[float] = 0.5
    acousticness: Optional[float] = 0.5
    instrumentalness: Optional[float] = 0.5
    # Add others as needed, keeping it simple for UI

@app.post("/api/v1/recommendations/custom")
def get_custom_recommendations(features: CustomFeatures, limit: int = 20):
    feature_dict = features.dict()
    recommendations = recommender.get_recommendations_by_features(feature_dict, limit)
    return {
        "features": feature_dict,
        "recommendations": recommendations,
        "count": len(recommendations)
    }



@app.get("/api/v1/genres")
def get_genres():
    genres = recommender.get_genres()
    return {"genres": genres, "count": len(genres)}

@app.get("/api/v1/genres/{genre_name}/tracks")
def get_genre_tracks(genre_name: str, limit: int = 20):
    tracks = recommender.get_tracks_by_genre(genre_name, limit)
    return {
        "genre": genre_name,
        "tracks": tracks,
        "count": len(tracks)
    }

from classifier import GenreClassifier
classifier = GenreClassifier()

@app.post("/api/v1/classify")
def classify_genre(features: CustomFeatures):
    result = classifier.predict(features.dict())
    if not result:
        raise HTTPException(status_code=500, detail="Model not loaded or prediction failed")
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
