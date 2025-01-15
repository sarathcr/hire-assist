import { environment } from '../../environments/environment';

// API - Endpoints
const { baseUrl } = environment;
export const apiUrl = `${baseUrl}/api`;

// AUTH
export const LOGIN_URL = `${baseUrl}/auth/login`;
export const REFRESH_TOKEN_URL = `${baseUrl}/auth/refresh`;
export const LOGOUT_URL = `${apiUrl}/auth/logout`;

// Candidate - Endpoints
export const CANDIDATE_URL = `${apiUrl}/candidate`;
