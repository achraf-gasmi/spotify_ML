FROM spotify-base:latest

WORKDIR /app

# copy top-level dataset and any env configuration
COPY ../data /app/data
COPY ../.env /app/.env

# Copy shared module and service code
COPY backend/services/shared /app/shared
COPY backend/services/recommender_service /app/recommender_service

# Ensure models are present
COPY backend/services/recommender_service/*.pkl /app/recommender_service/

# Expose port
EXPOSE 8002

# Command to run the service
CMD ["uvicorn", "recommender_service.main:app", "--host", "0.0.0.0", "--port", "8002"]
