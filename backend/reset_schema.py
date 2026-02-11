from database import engine, Base, SessionLocal
import models
import os

# For SQLite, adding a column to an existing table is tricky with just create_all
# Simplest for this dev phase is to drop the playlists table and recreate it
# WE DO NOT WANT TO DROP TRACKS (expensive to re-seed)

def reset_schema():
    print("Resetting Schema for Auth...")
    db = SessionLocal()
    
    # 1. Check if user table exists
    try:
        db.query(models.User).first()
        print("User table accessible")
    except:
        print("User table issues...")

    # For Dev: Drop playlists table to ensure user_id column is added correctly by create_all
    # This is destructive for playlists but fine for dev
    try:
        models.Playlist.__table__.drop(engine)
        print("Dropped playlists table")
    except Exception as e:
        print(f"Could not drop playlists (maybe didn't exist): {e}")

    # Recreate all (will skip existing Tracks, create Users and Playlists)
    models.Base.metadata.create_all(bind=engine)
    print("Schema recreated. Tracks should be intact.")

if __name__ == "__main__":
    reset_schema()
