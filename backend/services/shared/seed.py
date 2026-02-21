import pandas as pd
import os
import sys
from .database import SessionLocal, engine, Base
from .models import Track

# Handle data paths flexibly for Docker
DATA_DIR = os.getenv("DATA_DIR", "/app/data")
DATASET_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")

def seed_tracks():
    print(f"Seeding tracks from {DATASET_PATH}...")
    
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        return

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Track).first():
            print("Database already seeded with tracks.")
            return

        print("Reading CSV...")
        df = pd.read_csv(DATASET_PATH)
        print(f"Read {len(df)} tracks. Starting bulk insert...")

        tracks_to_add = []
        count = 0
        total = len(df)

        for _, row in df.iterrows():
            track = Track(
                track_id=str(row['track_id']),
                track_name=str(row['track_name']),
                artists=str(row['artists']),
                album_name=str(row.get('album_name', '')),
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
        
        print("Seeding completed successfully!")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_tracks()
