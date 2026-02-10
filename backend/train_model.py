import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
DATASET_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "genre_classifier.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "label_encoder.pkl")

FEATURE_COLS = [
    'danceability', 'energy', 'key', 'loudness', 'mode', 
    'speechiness', 'acousticness', 'instrumentalness', 
    'liveness', 'valence', 'tempo', 'time_signature'
]

def train_model():
    print("Loading data...")
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}")
        return

    df = pd.read_csv(DATASET_PATH)
    
    # Check if track_genre exists
    if 'track_genre' not in df.columns:
        print("track_genre column missing!")
        return

    X = df[FEATURE_COLS]
    y = df['track_genre']

    print(f"Training on {len(df)} samples across {len(y.unique())} genres...")

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    # Train
    # Using fewer trees (n_estimators=50) for speed in MVP
    clf = RandomForestClassifier(n_estimators=50, max_depth=20, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc:.4f}")

    # Save
    print("Saving model and encoder...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(clf, f)
    
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(le, f)
        
    print("Done!")

if __name__ == "__main__":
    train_model()
