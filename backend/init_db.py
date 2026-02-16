import pandas as pd
from database import engine, SessionLocal, Base
from models import Track
import os
import sys

# Add parent directory to path if needed (though running from backend dir usually works)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# point at the project‑level data folder
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DATASET_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")

def init_db():
    print("Initializing Database...")
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        print("Ensure PostgreSQL is running and the database (spotify_db) exists.")
        print("Connection URL used (from .env):", os.getenv("DATABASE_URL"))
        return

    db = SessionLocal()
    
    try:
        # Check if we have data
        if db.query(Track).first():
            print("Database already seeded with tracks.")
            return

        print(f"Loading data from {DATASET_PATH}...")
        if not os.path.exists(DATASET_PATH):
            print("Dataset not found!")
            return

        df = pd.read_csv(DATASET_PATH)
        print(f"Found {len(df)} tracks. Inserting...")
        
        tracks_to_add = []
        count = 0
        total = len(df)
        
        for _, row in df.iterrows():
            track = Track(
                track_id=str(row['track_id']),
                track_name=str(row['track_name']),
                artists=str(row['artists']),
                album_name=str(row['album_name']),
                track_genre=str(row['track_genre']),
                popularity=int(row['popularity']),
                duration_ms=int(row['duration_ms']),
                explicit=bool(row['explicit']),
                danceability=float(row['danceability']),
                energy=float(row['energy']),
                key=int(row['key']),
                loudness=float(row['loudness']),
                mode=int(row['mode']),
                speechiness=float(row['speechiness']),
                acousticness=float(row['acousticness']),
                instrumentalness=float(row['instrumentalness']),
                liveness=float(row['liveness']),
                valence=float(row['valence']),
                tempo=float(row['tempo']),
                time_signature=int(row['time_signature'])
            )
            tracks_to_add.append(track)
            count += 1
            
            if count % 5000 == 0:
                db.bulk_save_objects(tracks_to_add)
                db.commit()
                tracks_to_add = []
                print(f"Inserted {count}/{total} tracks...")
                
        if tracks_to_add:
            db.bulk_save_objects(tracks_to_add)
            db.commit()
            print(f"Inserted remaining {len(tracks_to_add)} tracks.")
            
        print("Database seeding completed.")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
