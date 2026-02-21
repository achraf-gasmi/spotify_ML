FROM spotify-base:latest

WORKDIR /app

# Copy shared module and service code
COPY backend/services/shared /app/shared
COPY backend/services/auth_service /app/auth_service

# Expose port
EXPOSE 8001

# Command to run the service
CMD ["uvicorn", "auth_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
