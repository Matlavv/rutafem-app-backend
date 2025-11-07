/**
 * Configuration centralisée pour les tests K6
 */

export const BASE_URL = __ENV.BASE_URL || 'http://backend:3000';
export const DATABASE_URL = __ENV.K6_DATABASE_URL;

// SLOs (Service Level Objectives) - à ajuster selon vos besoins
export const SLO = {
    // Temps de réponse acceptable (p95)
    p95Duration: 300, // 300ms

    // Temps de réponse acceptable (p99)
    p99Duration: 500, // 500ms

    // Taux d'erreur acceptable (5xx)
    errorRate: 0.01, // 1%

    // Taux de succès minimum
    successRate: 0.99, // 99%
};

// Endpoints critiques à tester
export const ENDPOINTS = {
    healthcheck: '/',
    rides: '/api/rides',
    rideById: (id) => `/api/rides/${id}`,
    login: '/api/auth/login',
    register: '/api/auth/register',
};

// Données de test
export const TEST_USER = {
    email: 'test-k6@example.com',
    password: 'Test123!@#',
    name: 'Test K6 User',
};
