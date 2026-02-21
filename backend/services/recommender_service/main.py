from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import sys
import os

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from original backend for now to reuse logic, will move later
# Actually better to copy recommender.py to the service folder for isolation
# For now, let's assume it's in the service folder

from .recommender import Recommender
from .classifier import GenreClassifier
from shared.auth import get_current_user
from shared.models import User, PreferenceProfile

app = FastAPI(title="Spotify Music Intelligence - Recommender Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
from shared.database import engine, Base, get_db
Base.metadata.create_all(bind=engine)

recommender = Recommender()
classifier = GenreClassifier()

class CustomFeatures(BaseModel):
    danceability: Optional[float] = 0.5
    energy: Optional[float] = 0.5
    key: Optional[int] = 5
    loudness: Optional[float] = -10.0
    mode: Optional[int] = 1
    speechiness: Optional[float] = 0.05
    acousticness: Optional[float] = 0.5
    instrumentalness: Optional[float] = 0.5
    liveness: Optional[float] = 0.1
    valence: Optional[float] = 0.5
    tempo: Optional[float] = 120.0
    time_signature: Optional[int] = 4

class PreferenceProfileCreate(BaseModel):
    name: str
    danceability: float
    energy: float
    valence: float
    acousticness: float
    instrumentalness: float
    speechiness: float
    liveness: float

@app.get("/api/v1/search")
def search_tracks(q: str = Query(..., min_length=1), limit: int = 20):
    results = recommender.search_tracks(q, limit)
    return {"results": results, "count": len(results)}

@app.get("/api/v1/recommendations/{track_id}")
def get_recommendations(track_id: str, limit: int = 20):
    source_track = recommender.get_track_by_id(track_id)
    if not source_track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    recommendations = recommender.get_recommendations(track_id, limit)
    return {
        "source_track": source_track,
        "recommendations": recommendations
    }

@app.get("/api/v1/recommendations/mood/{mood}")
def get_recommendations_by_mood(mood: str, limit: int = 20):
    recommendations = recommender.get_recommendations_by_mood(mood, limit)
    return {
        "mood": mood,
        "recommendations": recommendations,
        "count": len(recommendations)
    }

@app.post("/api/v1/recommendations/personalized")
def get_personalized_recommendations(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from shared.models import ListeningHistory
    
    # 1. Get user's own history
    user_history_entries = db.query(ListeningHistory).filter(ListeningHistory.user_id == current_user.id).all()
    user_history = [e.track_id for e in user_history_entries]
    
    # 2. Get all history for collaborative filtering
    all_history = db.query(ListeningHistory).all()
    all_history_data = [{"user_id": e.user_id, "track_id": e.track_id} for e in all_history]
    
    recommendations = recommender.get_personalized_recommendations(user_history, all_history_data, limit)
    return {
        "user_id": current_user.id,
        "recommendations": recommendations,
        "count": len(recommendations)
    }

@app.post("/api/v1/classify")
def classify_genre(features: CustomFeatures):
    result = classifier.predict(features.dict())
    if not result:
        raise HTTPException(status_code=500, detail="Model not loaded or prediction failed")
    return result

@app.get("/api/v1/genres")
def get_genres():
    genres = recommender.get_genres()
    return {"genres": genres, "count": len(genres)}

@app.get("/api/v1/genres/{genre}/tracks")
def get_genre_tracks(genre: str, limit: int = 20):
    tracks = recommender.get_tracks_by_genre(genre, limit)
    if not tracks:
        raise HTTPException(status_code=404, detail=f"No tracks found for genre: {genre}")
    return {"genre": genre, "tracks": tracks, "count": len(tracks)}

@app.post("/api/v1/recommendations/custom")
def get_custom_recommendations(features: CustomFeatures, limit: int = 20):
    recommendations = recommender.get_recommendations_by_features(features.dict(), limit)
    return {
        "features_requested": features,
        "recommendations": recommendations,
        "count": len(recommendations)
    }

@app.post("/api/v1/preferences")
def save_preference_profile(
    profile: PreferenceProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_profile = PreferenceProfile(
        name=profile.name,
        user_id=current_user.id,
        danceability=profile.danceability,
        energy=profile.energy,
        valence=profile.valence,
        acousticness=profile.acousticness,
        instrumentalness=profile.instrumentalness,
        speechiness=profile.speechiness,
        liveness=profile.liveness
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@app.get("/api/v1/preferences")
def get_preference_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profiles = db.query(PreferenceProfile).filter(PreferenceProfile.user_id == current_user.id).all()
    return profiles

@app.delete("/api/v1/preferences/{profile_id}")
def delete_preference_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(PreferenceProfile).filter(
        PreferenceProfile.id == profile_id, 
        PreferenceProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
