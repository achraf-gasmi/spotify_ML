FROM spotify-base:latest

WORKDIR /app

# Copy shared module and service code
COPY ./services/shared /app/shared
COPY ./services/playlist_service /app/playlist_service
# Playlist service imports Recommender for generation logic
COPY ./services/recommender_service/recommender.py /app/recommender_service/recommender.py

# Expose port
EXPOSE 8004

# Command to run the service
CMD ["uvicorn", "playlist_service.main:app", "--host", "0.0.0.0", "--port", "8004"]
