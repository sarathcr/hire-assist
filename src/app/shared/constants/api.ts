// LOCAL

import { environment } from '../../../environments/environment';

// API - Endpoints
const {
  baseUrl,
  authorizationUrl,
  assessmentUrl,
  collectionUrl,
  intreviewUrl,
} = environment;
export const apiUrl = `${baseUrl}`;
// const API_URL = environment.apiUrl;
export const BASE_IMAGE_URL = environment;
export const BASE_DOCUMENTS_URL = environment;
// AUTH
export const LOGIN_URL = `${authorizationUrl}/api/authorization/login`;
export const REFRESH_TOKEN_URL = `${authorizationUrl}/api/authorization/refresh-token`;
export const LOGOUT_URL = `${apiUrl}/auth/logout`;
export const RESET_PASSWORD_URL = `${authorizationUrl}/api/authorization/generate-reset-password-url`;
export const RESET_CHANGE_PASSWORD_URL = `${authorizationUrl}/api/authorization/reset-password`;

// DASHBOARD
export const DASHBOARD_URL = `${collectionUrl}/api/dashboard`;
export const COLLECTION_URL = `${collectionUrl}/api/collection`;

// Candidate - Endpoints
export const CANDIDATE_URL = `${apiUrl}`;

// ASSESSMENT
export const ASSESSMENT_URL = `${assessmentUrl}/api/assessment`;

// INTERVIEW
export const INTERVIEW_URL = `${intreviewUrl}/api/interview`;

// USER
export const USER_URL = `${authorizationUrl}/api/authorization/users-role-access`;

export const CANDIDATE_TEST_URL = `${baseUrl}/api/questionSet`;

//Batch
export const BATCH_URL = `${assessmentUrl}/api/assessment/Batch`;

//Panels
export const Panel_URL = `${intreviewUrl}/api/interview/panel`;
