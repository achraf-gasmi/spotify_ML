from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import sys
import os

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.database import get_db
from shared.models import User, Playlist, Track as TrackModel
from shared.auth import get_current_user
try:
    from recommender_service.recommender import Recommender
except ImportError:
    from .recommender import Recommender # Fallback if copied locally

app = FastAPI(title="Spotify Music Intelligence - Playlist Service", version="1.0")

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

class CustomPlaylistRequest(BaseModel):
    name: str
    track_ids: List[str]

class WorkoutPlaylistRequest(BaseModel):
    duration_minutes: int = 30
    intensity: str = "medium"

@app.post("/api/v1/playlists/generate")
def generate_playlist(
    name: str, 
    seed_track_id: Optional[str] = None, 
    mood: Optional[str] = None, 
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if seed_track_id:
        recommendations = recommender.get_recommendations(seed_track_id, limit)
    elif mood:
        recommendations = recommender.get_recommendations_by_mood(mood, limit)
    else:
        raise HTTPException(status_code=400, detail="Must provide seed_track_id or mood")
    
    new_playlist = Playlist(name=name, user_id=current_user.id)
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)
    
    track_ids = [t['track_id'] for t in recommendations]
    db_tracks = db.query(TrackModel).filter(TrackModel.track_id.in_(track_ids)).all()
    for db_track in db_tracks:
        new_playlist.tracks.append(db_track)
    db.commit()
    
    return {"playlist_id": new_playlist.id, "name": new_playlist.name, "tracks": recommendations}

@app.post("/api/v1/playlists/workout")
def generate_workout_playlist(req: WorkoutPlaylistRequest):
    tracks = recommender.get_workout_playlist(req.duration_minutes, req.intensity)
    return {"name": f"My {req.intensity.capitalize()} workout", "tracks": tracks}

@app.get("/api/v1/playlists")
def get_playlists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    playlists = db.query(Playlist).filter(Playlist.user_id == current_user.id).all()
    return [{"id": p.id, "name": p.name, "track_count": len(p.tracks), "created_at": p.created_at} for p in playlists]

@app.get("/api/v1/playlists/{playlist_id}")
def get_playlist_details(playlist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == current_user.id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    tracks = []
    for track in playlist.tracks:
        track_dict = {
            "track_id": track.track_id,
            "track_name": track.track_name,
            "artists": track.artists,
            "track_genre": track.track_genre,
            "popularity": track.popularity
        }
        tracks.append(track_dict)
        
    return {
        "id": playlist.id,
        "name": playlist.name,
        "tracks": tracks
    }

@app.post("/api/v1/playlists/custom")
def create_custom_playlist(
    req: CustomPlaylistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_playlist = Playlist(name=req.name, user_id=current_user.id)
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)
    
    db_tracks = db.query(TrackModel).filter(TrackModel.track_id.in_(req.track_ids)).all()
    for db_track in db_tracks:
        new_playlist.tracks.append(db_track)
    db.commit()
    
    return {"playlist_id": new_playlist.id, "name": new_playlist.name, "track_count": len(db_tracks)}

@app.post("/api/v1/playlists/{playlist_id}/tracks")
def add_track_to_playlist(
    playlist_id: int,
    track_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == current_user.id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    track = db.query(TrackModel).filter(TrackModel.track_id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
    if track not in playlist.tracks:
        playlist.tracks.append(track)
        db.commit()
        
    return {"message": "Track added to playlist"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
