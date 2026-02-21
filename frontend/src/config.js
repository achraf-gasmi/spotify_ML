// The frontend can target either the monolithic backend or individual microservices.
// Environment variables allow overriding each service URL. When none are provided the
// application assumes a single API at VITE_API_BASE (default http://localhost:8000).
// Vite exposes variables prefixed with VITE_ via import.meta.env.

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const SERVICES = {
    AUTH: import.meta.env.VITE_AUTH_SERVICE || BASE,
    RECOMMENDER: import.meta.env.VITE_RECOMMENDER_SERVICE || BASE,
    ANALYTICS: import.meta.env.VITE_ANALYTICS_SERVICE || BASE,
    PLAYLIST: import.meta.env.VITE_PLAYLIST_SERVICE || BASE,
};
