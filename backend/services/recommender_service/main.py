from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
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
from shared.models import User

app = FastAPI(title="Spotify Music Intelligence - Recommender Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
from shared.database import engine, Base
Base.metadata.create_all(bind=engine)

recommender = Recommender()
classifier = GenreClassifier()

class CustomFeatures(BaseModel):
    danceability: Optional[float] = 0.5
    energy: Optional[float] = 0.5
    valence: Optional[float] = 0.5
    acousticness: Optional[float] = 0.5
    instrumentalness: Optional[float] = 0.5

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
