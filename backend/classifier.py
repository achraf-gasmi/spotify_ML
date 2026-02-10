import pickle
import os
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "genre_classifier.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "label_encoder.pkl")
SCALER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scaler.pkl")

FEATURE_COLS = [
    'danceability', 'energy', 'key', 'loudness', 'mode', 
    'speechiness', 'acousticness', 'instrumentalness', 
    'liveness', 'valence', 'tempo', 'time_signature'
]

class GenreClassifier:
    def __init__(self):
        self.model = None
        self.encoder = None
        self.scaler = None
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            with open(MODEL_PATH, 'rb') as f:
                self.model = pickle.load(f)
            with open(ENCODER_PATH, 'rb') as f:
                self.encoder = pickle.load(f)
            if os.path.exists(SCALER_PATH):
                 with open(SCALER_PATH, 'rb') as f:
                    self.scaler = pickle.load(f)
        else:
            print("Model files not found. Please run train_xgboost.py first.")

    def predict(self, features: dict):
        if not self.model or not self.encoder:
            return None
            
        # Prepare input vector
        input_data = []
        for col in FEATURE_COLS:
            val = features.get(col, 0)
            input_data.append(val)
            
        # Reshape for prediction
        input_array = np.array(input_data).reshape(1, -1)
        
        # Scale if scaler exists
        if self.scaler:
            input_array = self.scaler.transform(input_array)
        
        # Predict
        try:
            prediction_proba = self.model.predict_proba(input_array)[0]
            
            # Get top 3 indices
            top_3_indices = prediction_proba.argsort()[-3:][::-1]
            
            top_3_genres = []
            for idx in top_3_indices:
                genre = self.encoder.inverse_transform([idx])[0]
                conf = float(prediction_proba[idx])
                top_3_genres.append({"genre": genre, "confidence": conf})
            
            return {
                "top_prediction": top_3_genres[0],
                "all_predictions": top_3_genres
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return None
