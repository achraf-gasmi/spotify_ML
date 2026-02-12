import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Note: You'll need a valid token to run this.
# I'll simulate a request to see if the endpoints are at least registered.

def test_workout_endpoint():
    print("Testing /playlists/workout...")
    # This might fail due to auth, but we can check the status code
    try:
        response = requests.post(f"{BASE_URL}/playlists/workout", 
                               json={"duration_minutes": 30, "intensity": "medium"})
        print(f"Status: {response.status_code}")
        # Expected 401 if unauthenticated, or 200/422 if auth is bypassed/wrong schema
    except Exception as e:
        print(f"Error: {e}")

def test_custom_playlist_endpoint():
    print("Testing /playlists/custom...")
    try:
        response = requests.post(f"{BASE_URL}/playlists/custom", 
                               json={"name": "Test Custom", "track_ids": ["test1", "test2"]})
        print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_workout_endpoint()
    test_custom_playlist_endpoint()
