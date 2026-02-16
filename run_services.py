import subprocess
import time
import sys
import os

services = [
    {"name": "Auth Service", "path": "backend/services/auth_service/main.py", "port": 8001},
    {"name": "Recommender Service", "path": "backend/services/recommender_service/main.py", "port": 8002},
    {"name": "Analytics Service", "path": "backend/services/analytics_service/main.py", "port": 8003},
    {"name": "Playlist Service", "path": "backend/services/playlist_service/main.py", "port": 8004},
]

processes = []

print("🚀 Starting Spotify Music Intelligence Microservices...")

# ensure the cleaned dataset exists in the project data folder
data_path = os.path.join(os.getcwd(), "data", "cleaned_dataset.csv")
if not os.path.exists(data_path):
    print(f"⚠️  Cleaned dataset not found at {data_path}. Attempting to generate it.")
    try:
        subprocess.run([sys.executable, "backend/clean_data.py"], check=True)
    except Exception as e:
        print("Failed to run clean_data.py automatically.", e)
        print("Please create 'data/cleaned_dataset.csv' manually before starting services.")

for service in services:
    print(f"📦 Launching {service['name']} on port {service['port']}...")
    # Use the same python interpreter
    process = subprocess.Popen([sys.executable, service['path']])
    processes.append(process)

print("\n✅ All services are running.")
print("Press Ctrl+C to stop all services.\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Stopping services...")
    for process in processes:
        process.terminate()
    print("👋 Goodbye!")
