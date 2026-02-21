FROM spotify-base:latest

WORKDIR /app

# include dataset and env file for analytics/trends
COPY ../data /app/data
COPY ../.env /app/.env

# Copy shared module and service code
COPY backend/services/shared /app/shared
COPY backend/services/analytics_service /app/analytics_service
# Analytics service needs parts of Recommender
COPY backend/services/recommender_service /app/recommender_service

# Expose port
EXPOSE 8003

# Command to run the service
CMD ["uvicorn", "analytics_service.main:app", "--host", "0.0.0.0", "--port", "8003"]
