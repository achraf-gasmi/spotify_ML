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
        elif mood == 'party':
            # High danceability, High energy, High valence
            filtered_df = filtered_df[
                (filtered_df['danceability'] > 0.7) & 
                (filtered_df['energy'] > 0.7) &
                (filtered_df['valence'] > 0.6)
            ]
        elif mood == 'workout':
            # Highest energy, High tempo (> 120 bpm)
            filtered_df = filtered_df[
                (filtered_df['energy'] > 0.8) & 
                (filtered_df['tempo'] > 120)
            ]
        elif mood == 'chill':
            # Low energy, Mid valence, High acousticness or instrumentalness
            filtered_df = filtered_df[
                (filtered_df['energy'] < 0.5) & 
                (filtered_df['acousticness'] > 0.4)
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

    def get_workout_playlist(self, duration_minutes: int = 30, target_intensity: str = 'medium'):
        """
        Generates a sequenced workout playlist with BPM phasing.
        Phases: Warm-up (20%), Peak (60%), Cool-down (20%)
        """
        # Average track duration ~3.5 minutes
        total_tracks = max(int(duration_minutes / 3.5), 5)
        
        warmup_count = max(int(total_tracks * 0.2), 1)
        peak_count = max(int(total_tracks * 0.6), 3)
        cooldown_count = max(total_tracks - warmup_count - peak_count, 1)
        
        # Phase definitions
        phases = [
            # Warm-up: Moderate BPM, Moderate Energy
            {'count': warmup_count, 'bpm_range': (100, 125), 'energy_min': 0.4, 'energy_max': 0.7},
            # Peak: High BPM, High Energy
            {'count': peak_count, 'bpm_range': (130, 180), 'energy_min': 0.7, 'energy_max': 1.0},
            # Cool-down: Low BPM, Low Energy
            {'count': cooldown_count, 'bpm_range': (80, 105), 'energy_min': 0.2, 'energy_max': 0.5}
        ]
        
        if target_intensity == 'high':
            # Boost peak intensity
            phases[1]['energy_min'] = 0.8
            phases[1]['bpm_range'] = (140, 190)
        elif target_intensity == 'low':
            # Lower intensity across the board
            phases[1]['energy_min'] = 0.6
            phases[1]['bpm_range'] = (120, 150)
            
        workout_tracks = []
        
        for phase in phases:
            filtered_df = self.df[
                (self.df['tempo'] >= phase['bpm_range'][0]) & 
                (self.df['tempo'] <= phase['bpm_range'][1]) &
                (self.df['energy'] >= phase['energy_min']) &
                (self.df['energy'] <= phase['energy_max'])
            ]
            
            if filtered_df.empty:
                # Fallback: Relax energy constraints if no exact matches
                filtered_df = self.df[
                    (self.df['tempo'] >= phase['bpm_range'][0] - 10) & 
                    (self.df['tempo'] <= phase['bpm_range'][1] + 10)
                ]
            
            sample_size = min(len(filtered_df), phase['count'])
            if not filtered_df.empty:
                phase_tracks = filtered_df.sample(n=sample_size).to_dict('records')
                workout_tracks.extend(phase_tracks)
                
        return workout_tracks

    def get_genre_analytics(self, genre: str):
        """
        Calculates aggregate analytics for a specific genre.
        Includes average audio features, popularity distribution, and top tracks.
        """
        genre_tracks = self.df[self.df['track_genre'].str.lower() == genre.lower()].copy()
        
        if genre_tracks.empty:
            return None
            
        # Calculate mean for all 17 audio features
        # Note: FEATURE_COLS only has 12 features, but the dataset has 17. 
        # Let's include all numeric columns that are relevant.
        numeric_cols = genre_tracks.select_dtypes(include=[np.number]).columns.tolist()
        # Filter out key-like/ID columns if necessary, but averages are usually fine.
        
        averages = genre_tracks[numeric_cols].mean().to_dict()
        
        # Popularity stats
        popularity_stats = {
            "avg": float(genre_tracks['popularity'].mean()),
            "max": int(genre_tracks['popularity'].max()),
            "min": int(genre_tracks['popularity'].min())
        }
        
        # Top 5 tracks by popularity
        top_tracks = genre_tracks.sort_values(by='popularity', ascending=False).head(5)
        top_tracks_list = top_tracks.to_dict('records')
        
        # Top 5 artists by track count and popularity
        top_artists = genre_tracks.groupby('artists')['popularity'].agg(['mean', 'count']).sort_values(by='mean', ascending=False).head(5)
        top_artists_list = []
        for artist, row in top_artists.iterrows():
            top_artists_list.append({
                "name": artist,
                "avg_popularity": float(row['mean']),
                "track_count": int(row['count'])
            })
            
        return {
            "genre": genre,
            "total_tracks": len(genre_tracks),
            "average_features": averages,
            "popularity_stats": popularity_stats,
            "top_tracks": top_tracks_list,
            "top_artists": top_artists_list
        }
