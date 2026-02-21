# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_AUTH_SERVICE
ARG VITE_RECOMMENDER_SERVICE
ARG VITE_ANALYTICS_SERVICE
ARG VITE_PLAYLIST_SERVICE

# Create .env file for Vite build
RUN echo "VITE_AUTH_SERVICE=$VITE_AUTH_SERVICE" > .env.production && \
    echo "VITE_RECOMMENDER_SERVICE=$VITE_RECOMMENDER_SERVICE" >> .env.production && \
    echo "VITE_ANALYTICS_SERVICE=$VITE_ANALYTICS_SERVICE" >> .env.production && \
    echo "VITE_PLAYLIST_SERVICE=$VITE_PLAYLIST_SERVICE" >> .env.production

RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config if needed for SPA routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
