import pandas as pd
import os

# make sure we reference the top‑level data folder (Recommendation root)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
INPUT_PATH = os.path.join(DATA_DIR, "dataset.csv")
OUTPUT_PATH = os.path.join(DATA_DIR, "cleaned_dataset.csv")

def clean_data():
    # create data directory if needed
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found at {INPUT_PATH}")
        print("Please place the raw dataset 'dataset.csv' in the top-level data folder.")
        return

    print("Loading raw dataset...")
    df = pd.read_csv(INPUT_PATH)
    
    # 1. Drop 'Unnamed: 0'
    if 'Unnamed: 0' in df.columns:
        df = df.drop(columns=['Unnamed: 0'])
    
    # 2. Drop rows with missing values
    initial_len = len(df)
    df = df.dropna()
    print(f"Dropped {initial_len - len(df)} rows with missing values.")
    
    # 3. Drop duplicates based on track_id
    # We keep the first occurrence.
    len_before_dedup = len(df)
    df = df.drop_duplicates(subset=['track_id'])
    print(f"Dropped {len_before_dedup - len(df)} duplicate track_ids.")
    
    # Save cleaned data
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Cleaned dataset saved to {OUTPUT_PATH}")
    print(f"Final shape: {df.shape}")

if __name__ == "__main__":
    clean_data()
