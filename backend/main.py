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
    valid_moods = ['happy', 'sad', 'energetic', 'calm', 'focused', 'party', 'workout', 'chill']
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

# Database Dependency
from sqlalchemy.orm import Session
from database import get_db
from models import Playlist, Track as TrackModel, playlist_track, User
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from auth import oauth2_scheme, get_current_user, create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from pydantic import BaseModel

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    class Config:
        from_attributes = True

@app.post("/api/v1/auth/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/v1/auth/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/auth/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Playlist Routes (Protected)
@app.post("/api/v1/playlists/generate")
def generate_playlist(
    name: str, 
    seed_track_id: Optional[str] = None, 
    mood: Optional[str] = None, 
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # simple logic: get recommendations -> save as playlist
    recommendations = []
    
    if seed_track_id:
        recommendations = recommender.get_recommendations(seed_track_id, limit)
    elif mood:
        recommendations = recommender.get_recommendations_by_mood(mood, limit)
    else:
        raise HTTPException(status_code=400, detail="Must provide seed_track_id or mood")
    
    if not recommendations:
        raise HTTPException(status_code=404, detail="No tracks found to generate playlist")

    # Create Playlist for Current User
    new_playlist = Playlist(name=name, user_id=current_user.id)
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)
    
    # Add tracks
    track_ids = [t['track_id'] for t in recommendations]
    
    db_tracks = db.query(TrackModel).filter(TrackModel.track_id.in_(track_ids)).all()
    
    for db_track in db_tracks:
        new_playlist.tracks.append(db_track)
        
    db.commit()
    
    return {
        "playlist_id": new_playlist.id,
        "name": new_playlist.name,
        "track_count": len(db_tracks),
        "tracks": recommendations 
    }

class CustomPlaylistRequest(BaseModel):
    name: str
    track_ids: List[str]

@app.post("/api/v1/playlists/custom")
def create_custom_playlist(
    req: CustomPlaylistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.track_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one track ID")
        
    new_playlist = Playlist(name=req.name, user_id=current_user.id)
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)
    
    db_tracks = db.query(TrackModel).filter(TrackModel.track_id.in_(req.track_ids)).all()
    
    # Maintain order from track_ids if possible (SQLAlchemy won't automatically)
    # For now, just add them.
    for db_track in db_tracks:
        new_playlist.tracks.append(db_track)
        
    db.commit()
    
    return {
        "playlist_id": new_playlist.id,
        "name": new_playlist.name,
        "track_count": len(db_tracks)
    }

@app.get("/api/v1/playlists")
def get_playlists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only return playlists for the current user
    playlists = db.query(Playlist).filter(Playlist.user_id == current_user.id).all()
    return [{ "id": p.id, "name": p.name, "created_at": p.created_at, "track_count": len(p.tracks) } for p in playlists]

@app.get("/api/v1/playlists/{playlist_id}")
def get_playlist(playlist_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id, Playlist.user_id == current_user.id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return {
        "id": playlist.id,
        "name": playlist.name,
        "created_at": playlist.created_at,
        "tracks": [
            {
                "track_id": t.track_id,
                "track_name": t.track_name,
                "artists": t.artists,
                "album_name": t.album_name,
            } 
            for t in playlist.tracks
        ]
    }

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
    
    # Check if track exists in the main tracks table
    db_track = db.query(TrackModel).filter(TrackModel.track_id == track_id).first()
    if not db_track:
        raise HTTPException(status_code=404, detail="Track not found in database")
    
    # Check if already in playlist
    if db_track in playlist.tracks:
        return {"message": "Track already in playlist"}
        
    playlist.tracks.append(db_track)
    db.commit()
    
    return {"message": f"Track {db_track.track_name} added to playlist {playlist.name}"}

# Preference Profile Routes
from models import PreferenceProfile

class PreferenceProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    danceability: float = 0.5
    energy: float = 0.5
    valence: float = 0.5
    acousticness: float = 0.5
    instrumentalness: float = 0.5
    speechiness: float = 0.5
    liveness: float = 0.5

@app.post("/api/v1/preferences")
def create_preference_profile(
    profile: PreferenceProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_profile = PreferenceProfile(
        **profile.dict(),
        user_id=current_user.id
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile

@app.get("/api/v1/preferences")
def list_preference_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PreferenceProfile).filter(PreferenceProfile.user_id == current_user.id).all()

@app.delete("/api/v1/preferences/{profile_id}")
def delete_preference_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(PreferenceProfile).filter(PreferenceProfile.id == profile_id, PreferenceProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted"}

# Analytics and History Routes
from models import ListeningHistory, Track as TrackModel
from sqlalchemy import func

@app.post("/api/v1/history")
def record_listening_history(
    track_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify track exists
    track = db.query(TrackModel).filter(TrackModel.track_id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
        
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
    # Basic summary stats
    history_count = db.query(ListeningHistory).filter(ListeningHistory.user_id == current_user.id).count()
    
    if history_count == 0:
        return {
            "total_plays": 0,
            "top_genres": [],
            "average_features": {}
        }
        
    # Get all tracks played by user to calculate averages
    # Join with Track to get features
    history_tracks = db.query(TrackModel).join(
        ListeningHistory, TrackModel.track_id == ListeningHistory.track_id
    ).filter(ListeningHistory.user_id == current_user.id).all()
    
    # Calculate average features
    features = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'speechiness', 'tempo']
    averages = {}
    for f in features:
        averages[f] = sum(getattr(t, f) for t in history_tracks) / len(history_tracks)
        
    # Top Genres (simple count)
    genre_counts = {}
    for t in history_tracks:
        genre = t.track_genre
        if genre:
            genre_counts[genre] = genre_counts.get(genre, 0) + 1
            
    top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_plays": history_count,
        "top_genres": [{"genre": g, "count": c} for g, c in top_genres],
        "average_features": averages
    }

class WorkoutPlaylistRequest(BaseModel):
    duration_minutes: int = 30
    intensity: str = "medium" # low, medium, high

@app.post("/api/v1/playlists/workout")
def generate_workout_playlist(
    req: WorkoutPlaylistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tracks = recommender.get_workout_playlist(req.duration_minutes, req.intensity)
    
    if not tracks:
        raise HTTPException(status_code=404, detail="Could not find suitable tracks for your workout criteria.")
        
    return {
        "name": f"My {req.intensity.capitalize()} workout",
        "duration_requested": req.duration_minutes,
        "total_tracks": len(tracks),
        "tracks": tracks
    }

@app.get("/api/v1/genres/{genre}/analytics")
def get_genre_analytics(
    genre: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analytics = recommender.get_genre_analytics(genre)
    if not analytics:
        raise HTTPException(status_code=404, detail=f"Genre '{genre}' not found")
    return analytics

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
