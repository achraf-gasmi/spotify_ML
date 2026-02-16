from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from .database import Base
import datetime

# Association table for Playlist <-> Track
playlist_track = Table('playlist_track', Base.metadata,
    Column('playlist_id', Integer, ForeignKey('playlists.id')),
    Column('track_id', String, ForeignKey('tracks.track_id'))
)

class Track(Base):
    __tablename__ = "tracks"

    track_id = Column(String, primary_key=True, index=True)
    track_name = Column(String)
    artists = Column(String)
    album_name = Column(String)
    track_genre = Column(String)
    popularity = Column(Integer)
    duration_ms = Column(Integer)
    explicit = Column(Boolean)
    danceability = Column(Float)
    energy = Column(Float)
    key = Column(Integer)
    loudness = Column(Float)
    mode = Column(Integer)
    speechiness = Column(Float)
    acousticness = Column(Float)
    instrumentalness = Column(Float)
    liveness = Column(Float)
    valence = Column(Float)
    tempo = Column(Float)
    time_signature = Column(Integer)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    playlists = relationship("Playlist", back_populates="owner")
    preference_profiles = relationship("PreferenceProfile", back_populates="owner")
    listening_history = relationship("ListeningHistory", back_populates="owner")

class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="playlists")
    tracks = relationship("Track", secondary=playlist_track, backref="playlists")

class PreferenceProfile(Base):
    __tablename__ = "preference_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    
    # Audio features
    danceability = Column(Float, default=0.5)
    energy = Column(Float, default=0.5)
    valence = Column(Float, default=0.5)
    acousticness = Column(Float, default=0.5)
    instrumentalness = Column(Float, default=0.5)
    speechiness = Column(Float, default=0.5)
    liveness = Column(Float, default=0.5)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="preference_profiles")

class ListeningHistory(Base):
    __tablename__ = "listening_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    track_id = Column(String, ForeignKey("tracks.track_id"))
    played_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Interaction details
    interaction_type = Column(String, default="play") # play, skip, like
    
    owner = relationship("User", back_populates="listening_history")
    track = relationship("Track")

# Update User model to include listening_history
# (Already updated in User class below)

# Update User model to include preference_profiles
# (Already defined in User class during initial research, let's verify)

