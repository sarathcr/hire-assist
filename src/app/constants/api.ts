// LOCAL
const API = 'http://localhost:5019';

import { environment } from '../../environments/environment';

// API - Endpoints
const { baseUrl } = environment;
export const apiUrl = `${baseUrl}`;

// AUTH
export const LOGIN_URL = `${baseUrl}/api/authorization/login`;
export const REFRESH_TOKEN_URL = `${baseUrl}/auth/refresh`;
export const LOGOUT_URL = `${apiUrl}/auth/logout`;

// Candidate - Endpoints
export const CANDIDATE_URL = `${apiUrl}`;

// ASSESSMENT
export const ASSESSMENT_URL = `${apiUrl}/assessment`;
// export const CREATEASSESSMENT_URL= `${apiUrl}/assessment`;
