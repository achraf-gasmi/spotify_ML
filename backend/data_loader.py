import pandas as pd
import os

# use project root data directory (Recommendation root)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")
HF_DATASET_URL = "hf://datasets/achrafgasmi/spotify-tracks-dataset/dataset.csv"

def load_data():
    """
    Loads the dataset from the local file if it exists, otherwise downloads it from Hugging Face.
    """
    if os.path.exists(DATASET_PATH):
        print(f"Loading dataset from {DATASET_PATH}...")
        try:
            df = pd.read_csv(DATASET_PATH)
            print("Dataset loaded successfully.")
            return df
        except Exception as e:
            print(f"Error loading local dataset: {e}. Downloading freshly.")
    
    print(f"Downloading dataset from {HF_DATASET_URL}...")
    try:
        df = pd.read_csv(HF_DATASET_URL)
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        # Save to local
        df.to_csv(DATASET_PATH, index=False)
        print(f"Dataset saved to {DATASET_PATH}.")
        return df
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return None

if __name__ == "__main__":
    load_data()
