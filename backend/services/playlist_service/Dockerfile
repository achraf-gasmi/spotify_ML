FROM spotify-base:latest

WORKDIR /app

# Copy shared module and service code
COPY backend/services/shared /app/shared
COPY backend/services/playlist_service /app/playlist_service
# Playlist service needs parts of Recommender
COPY backend/services/recommender_service /app/recommender_service

# Expose port
EXPOSE 8004

# Command to run the service
CMD ["uvicorn", "playlist_service.main:app", "--host", "0.0.0.0", "--port", "8004"]
