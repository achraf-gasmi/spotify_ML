import os
import pandas as pd
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv
import time

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "spotify-intelligence")

# absolute path calculation ensures script works from any cwd
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "cleaned_dataset.csv")

FEATURE_COLS = [
    'danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
    'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'
]

def setup_pinecone():
    print("🌲 Initializing Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Check if index exists, if not create it
    if INDEX_NAME not in pc.list_indexes().names():
        print(f"🔨 Creating index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=len(FEATURE_COLS),
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        print("⏳ Waiting for index to be ready...")
        while not pc.describe_index(INDEX_NAME).status['ready']:
            time.sleep(1)
    
    index = pc.Index(INDEX_NAME)
    
    print(f"📊 Loading dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Preprocess features (same as in recommender.py)
    print("🧹 Preprocessing features...")
    scaler = MinMaxScaler()
    scaled_features = scaler.fit_transform(df[FEATURE_COLS])
    
    print(f"🚀 Upserting {len(df)} vectors to Pinecone...")
    
    # Prepare vectors for upsert (id, values, metadata)
    # We'll batch them to avoid payload size limits
    batch_size = 100
    for i in range(0, len(df), batch_size):
        batch_df = df.iloc[i:i+batch_size]
        batch_vectors = scaled_features[i:i+batch_size]
        
        upsert_data = []
        for j, (idx, row) in enumerate(batch_df.iterrows()):
            upsert_data.append({
                "id": row['track_id'],
                "values": batch_vectors[j].tolist(),
                "metadata": {
                    "track_name": str(row['track_name']),
                    "artists": str(row['artists']),
                    "track_genre": str(row['track_genre']),
                    "popularity": float(row['popularity'])
                }
            })
        
        index.upsert(vectors=upsert_data)
        if i % 1000 == 0:
            print(f"✅ Upserted {i}/{len(df)} tracks...")

    print("🏁 Pinecone setup complete!")

if __name__ == "__main__":
    if not PINECONE_API_KEY:
        print("❌ Error: PINECONE_API_KEY not found in .env")
    else:
        setup_pinecone()
