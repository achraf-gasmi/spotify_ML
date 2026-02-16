// The frontend can target either the monolithic backend or individual microservices.
// Environment variables allow overriding each service URL. When none are provided the
// application assumes a single API at REACT_APP_API_BASE (default http://localhost:8000).

const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export const SERVICES = {
    AUTH: process.env.REACT_APP_AUTH_SERVICE || BASE,
    RECOMMENDER: process.env.REACT_APP_RECOMMENDER_SERVICE || BASE,
    ANALYTICS: process.env.REACT_APP_ANALYTICS_SERVICE || BASE,
    PLAYLIST: process.env.REACT_APP_PLAYLIST_SERVICE || BASE,
};
