from database import engine, Base
import models

def migrate():
    print("Migrating schema...")
    # SQL Alchemy sync doesn't handle migrations well (dropping/altering columns)
    # for SQLite in dev, it's often easier to just create new tables if they don't exist
    # OR for this MVP, since we are adding a User table, that one will be created.
    # The Playlist table modification (adding user_id) might fail if table exists.
    
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Schema migration attempted.")
        print("Note: If using SQLite and 'playlists' table already existed, 'user_id' column might be missing.")
        print("For Dev MVP: We might need to recreate the database if columns are missing.")
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
