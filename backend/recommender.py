import pandas as pd
import os
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DATASET_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")

FEATURE_COLS = [
    'danceability', 'energy', 'key', 'loudness', 'mode', 
    'speechiness', 'acousticness', 'instrumentalness', 
    'liveness', 'valence', 'tempo', 'time_signature'
]

class Recommender:
    def __init__(self):
        self.df = None
        self.scaled_features = None
        self._load_data()

    def _load_data(self):
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Please run clean_data.py first.")
        
        self.df = pd.read_csv(DATASET_PATH)
        
        # Normalize features
        scaler = MinMaxScaler()
        self.scaled_features = scaler.fit_transform(self.df[FEATURE_COLS])
        
    def get_recommendations(self, track_id: str, limit: int = 20):
        """
        Returns recommendations based on audio feature similarity.
        """
        # Find the index of the track
        track_idx = self.df.index[self.df['track_id'] == track_id].tolist()
        
        if not track_idx:
            return []
        
        track_idx = track_idx[0]
        
        # Calculate cosine similarity between the input track and all other tracks
        # Note: For large datasets, this can be slow. 
        # For 89k rows, doing it on-the-fly might take a second or two.
        # We can optimize by pre-calculating or using KDTree/BallTree if needed.
        # For now, let's try direct cosine similarity for MVP.
        
        input_vector = self.scaled_features[track_idx].reshape(1, -1)
        sim_scores = cosine_similarity(input_vector, self.scaled_features).flatten()
        
        # Get top indices
        # We start from 1 because 0 is the track itself (similarity 1.0)
        top_indices = sim_scores.argsort()[::-1][1:limit+1]
        
        recommendations = []
        for idx in top_indices:
            track = self.df.iloc[idx].to_dict()
            track['similarity_score'] = float(sim_scores[idx])
            recommendations.append(track)
            
        return recommendations

    def search_tracks(self, query: str, limit: int = 20):
        """
        Simple case-insensitive search by track name or artist.
        """
        if not query:
            return []
        
        mask = (
            self.df['track_name'].str.contains(query, case=False, na=False) | 
            self.df['artists'].str.contains(query, case=False, na=False)
        )
        results = self.df[mask].head(limit)
        return results.to_dict('records')

    def get_track_by_id(self, track_id: str):
        row = self.df[self.df['track_id'] == track_id]
        if row.empty:
            return None
        return row.iloc[0].to_dict()
