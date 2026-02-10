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

    def get_recommendations_by_mood(self, mood: str, limit: int = 20):
        """
        Returns random recommendations based on mood profiles.
        """
        mood = mood.lower()
        filtered_df = self.df.copy()
        
        if mood == 'happy':
            # High valence (positive), High energy
            filtered_df = filtered_df[
                (filtered_df['valence'] > 0.6) & 
                (filtered_df['energy'] > 0.6)
            ]
        elif mood == 'sad':
            # Low valence (negative), Low energy
            filtered_df = filtered_df[
                (filtered_df['valence'] < 0.4) & 
                (filtered_df['energy'] < 0.4)
            ]
        elif mood == 'energetic':
            # High energy, High danceability
            filtered_df = filtered_df[
                (filtered_df['energy'] > 0.7) & 
                (filtered_df['danceability'] > 0.6)
            ]
        elif mood == 'calm':
            # Low energy, High acousticness
            filtered_df = filtered_df[
                (filtered_df['energy'] < 0.4) & 
                (filtered_df['acousticness'] > 0.5)
            ]
        elif mood == 'focused':
            # High instrumentalness, Low speechiness
            filtered_df = filtered_df[
                (filtered_df['instrumentalness'] > 0.5) & 
                (filtered_df['speechiness'] < 0.3)
            ]
            
        if filtered_df.empty:
            return []
            
        # Randomly sample from the filtered results to ensure variety
        # Use min to avoid error if filtered_df has fewer rows than limit
        sample_size = min(len(filtered_df), limit)
        results = filtered_df.sample(n=sample_size)
        
        return results.to_dict('records')

        return results.to_dict('records')

    def get_recommendations_by_features(self, target_features: dict, limit: int = 20):
        """
        Returns recommendations based on a target feature vector.
        target_features should be a dict like {'energy': 0.8, 'valence': 0.5}
        """
        # Create a zero vector for all features
        target_vector = np.zeros((1, len(FEATURE_COLS)))
        
        # We need to correctly populate this vector based on FEATURE_COLS order
        # If a feature is not provided, we should probably set it to the mean of that feature 
        # or just ignore it (but cosine sim needs same dimensionality).
        # Better approach: Use the provided features, and for missing ones, use 0.5 (midpoint) or filtered average.
        # For MVP, let's assume the user adjusts specific sliders and we default others to 0.5
        
        for i, col in enumerate(FEATURE_COLS):
            val = target_features.get(col, 0.5) # Default to 0.5 (neutral)
            target_vector[0, i] = val
            
        # Calculate similarity
        sim_scores = cosine_similarity(target_vector, self.scaled_features).flatten()
        
        # Get top indices
        top_indices = sim_scores.argsort()[::-1][:limit]
        
        recommendations = []
        for idx in top_indices:
            track = self.df.iloc[idx].to_dict()
            track['similarity_score'] = float(sim_scores[idx])
            recommendations.append(track)
            
        return recommendations

        return results.to_dict('records')

    def get_genres(self):
        """Returns a list of unique genres."""
        if 'track_genre' in self.df.columns:
            return sorted(self.df['track_genre'].dropna().unique().tolist())
        return []

    def get_tracks_by_genre(self, genre: str, limit: int = 20):
        """Returns tracks for a specific genre."""
        if 'track_genre' not in self.df.columns:
            return []
            
        genre_tracks = self.df[self.df['track_genre'].str.lower() == genre.lower()]
        
        if genre_tracks.empty:
            return []
            
        # Return random sample
        sample_size = min(len(genre_tracks), limit)
        return genre_tracks.sample(n=sample_size).to_dict('records')

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
