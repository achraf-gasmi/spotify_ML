import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
DATASET_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "genre_classifier.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "label_encoder.pkl")
SCALER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scaler.pkl")

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
    
    if 'track_genre' not in df.columns:
        print("track_genre column missing!")
        return

    # Filter out genres with too few samples if necessary
    # For now, we keep all
    
    X = df[FEATURE_COLS]
    y = df['track_genre']

    print(f"Training on {len(df)} samples across {len(y.unique())} genres...")

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.1, random_state=42, stratify=y_encoded)

    # Scale features (XGBoost doesn't strictly need it, but it often helps convergence)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost
    # Using more robust parameters
    print("Training XGBoost Classifier...")
    clf = XGBClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softprob',
        random_state=42,
        n_jobs=-1,
        tree_method='hist' # Faster training
    )
    
    clf.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc:.4f}")
    
    # Save artifacts
    print("Saving model, encoder, and scaler...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(clf, f)
    
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(le, f)
        
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
        
    print("Done!")

if __name__ == "__main__":
    train_model()
