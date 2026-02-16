FROM spotify-base:latest

WORKDIR /app

# copy top-level dataset and any env configuration
COPY ../data /app/data
COPY ../.env /app/.env

# Copy shared module and service code
COPY ./services/shared /app/shared
COPY ./services/recommender_service /app/recommender_service

# The recommender needs the dataset and models (copy from service folder)
# legacy: still copy if any are placed there
COPY ./services/recommender_service/*.csv /app/recommender_service/ || true
COPY ./services/recommender_service/*.pkl /app/recommender_service/ || true

# Expose port
EXPOSE 8002

# Command to run the service
CMD ["uvicorn", "recommender_service.main:app", "--host", "0.0.0.0", "--port", "8002"]
