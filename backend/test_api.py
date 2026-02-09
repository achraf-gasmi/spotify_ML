import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api():
    # Wait for server to start
    print("Waiting for server to start...")
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/")
            if response.status_code == 200:
                print("Server is up!")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print("Server failed to start.")
        return

    # Test Search
    print("\nTesting Search API...")
    search_query = "Taylor Swift"
    response = requests.get(f"{BASE_URL}/api/v1/search", params={"q": search_query, "limit": 5})
    if response.status_code == 200:
        data = response.json()
        print(f"Found {data['count']} results for '{search_query}'")
        if data['count'] > 0:
            first_track = data['results'][0]
            print(f"First result: {first_track['track_name']} by {first_track['artists']} (ID: {first_track['track_id']})")
            
            # Test Recommendations
            track_id = first_track['track_id']
            print(f"\nTesting Recommendation API for track ID: {track_id}...")
            # Note: This might take a few seconds due to similarity calculation
            start_time = time.time()
            rec_response = requests.get(f"{BASE_URL}/api/v1/recommendations/{track_id}", params={"limit": 5})
            end_time = time.time()
            
            if rec_response.status_code == 200:
                rec_data = rec_response.json()
                print(f"Got {len(rec_data['recommendations'])} recommendations in {end_time - start_time:.2f} seconds.")
                for i, rec in enumerate(rec_data['recommendations']):
                    print(f"{i+1}. {rec['track_name']} by {rec['artists']} (Score: {rec['similarity_score']:.4f})")
            else:
                print(f"Recommendation failed: {rec_response.status_code} {rec_response.text}")
        else:
            print("No results found, cannot test recommendations.")
    else:
        print(f"Search failed: {response.status_code} {response.text}")

if __name__ == "__main__":
    test_api()
