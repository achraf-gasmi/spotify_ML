FROM spotify-base:latest

WORKDIR /app

# include dataset and env file for analytics/trends
COPY ../data /app/data
COPY ../.env /app/.env

# Copy shared module and service code
COPY ./services/shared /app/shared
COPY ./services/analytics_service /app/analytics_service
# Analytics service imports Recommender for trend logic
COPY ./services/recommender_service/recommender.py /app/recommender_service/recommender.py

# Expose port
EXPOSE 8003

# Command to run the service
CMD ["uvicorn", "analytics_service.main:app", "--host", "0.0.0.0", "--port", "8003"]
