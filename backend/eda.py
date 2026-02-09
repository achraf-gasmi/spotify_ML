import pandas as pd
import os

# Use absolute path to be safe, echoing data_loader.py logic
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")

def run_eda():
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}")
        return

    df = pd.read_csv(DATASET_PATH)
    
    print("=== Dataset Info ===")
    print(df.info())
    print("\n=== First 5 Rows ===")
    print(df.head())
    print("\n=== Describe === ")
    print(df.describe())
    print("\n=== Missing Values ===")
    print(df.isnull().sum())
    print("\n=== Duplicate Rows ===")
    print(df.duplicated().sum())
    
    # Check if 'track_id' is unique
    if 'track_id' in df.columns:
        print(f"\nUnique track_ids: {df['track_id'].nunique()} out of {len(df)}")
    else:
        print("\n'track_id' column not found.")

if __name__ == "__main__":
    run_eda()
