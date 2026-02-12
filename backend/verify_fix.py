import requests

base_url = "http://localhost:8000/api/v1/recommendations/mood"
moods = ['party', 'workout', 'chill']

for mood in moods:
    try:
        response = requests.get(f"{base_url}/{mood}?limit=5")
        if response.status_code == 200:
            tracks = response.json().get('recommendations', [])
            print(f"Mood: {mood}, Success: Yes, Tracks found: {len(tracks)}")
        else:
            print(f"Mood: {mood}, Success: No, Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print(f"Mood: {mood}, Error: {str(e)}")
