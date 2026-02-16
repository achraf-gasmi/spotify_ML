from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import sys
import os

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import get_db
from shared.models import User, ListeningHistory, Track as TrackModel
from shared.auth import get_current_user
# We need Recommender for trend analysis logic
try:
    from recommender_service.recommender import Recommender
except ImportError:
    from .recommender import Recommender # Fallback if copied locally

app = FastAPI(title="Spotify Music Intelligence - Analytics Service", version="1.0")

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

@app.post("/api/v1/history")
def record_listening_history(
    track_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history_entry = ListeningHistory(
        user_id=current_user.id,
        track_id=track_id
    )
    db.add(history_entry)
    db.commit()
    return {"message": "Listening event recorded"}

@app.get("/api/v1/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Logic moved from monolithic main.py
    history_count = db.query(ListeningHistory).filter(ListeningHistory.user_id == current_user.id).count()
    if history_count == 0:
        return {"total_plays": 0, "top_genres": [], "average_features": {}}
        
    history_tracks = db.query(TrackModel).join(
        ListeningHistory, TrackModel.track_id == ListeningHistory.track_id
    ).filter(ListeningHistory.user_id == current_user.id).all()
    
    features = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'speechiness', 'tempo']
    averages = {f: sum(getattr(t, f) for t in history_tracks) / len(history_tracks) for f in features}
        
    genre_counts = {}
    for t in history_tracks:
        genre_counts[t.track_genre] = genre_counts.get(t.track_genre, 0) + 1
    top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_plays": history_count,
        "top_genres": [{"genre": g, "count": c} for g, c in top_genres],
        "average_features": averages
    }

@app.get("/api/v1/analytics/trends")
def get_global_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return recommender.get_trend_analysis()

@app.get("/api/v1/genres/{genre}/analytics")
def get_genre_analytics(genre: str):
    analytics = recommender.get_genre_analytics(genre)
    if not analytics:
        raise HTTPException(status_code=404, detail=f"Genre '{genre}' not found")
    return analytics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
