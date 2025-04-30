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

// AUTH
export const LOGIN_URL = `${authorizationUrl}/api/authorization/login`;
export const REFRESH_TOKEN_URL = `${authorizationUrl}/api/authorization/refresh-token`;
export const LOGOUT_URL = `${apiUrl}/auth/logout`;

// DASHBOARD
export const DASHBOARD_URL = `${collectionUrl}/api/dashboard`;

// Candidate - Endpoints
export const CANDIDATE_URL = `${apiUrl}`;

// ASSESSMENT
export const ASSESSMENT_URL = `${assessmentUrl}/api/assessment`;
// export const CREATEASSESSMENT_URL= `${apiUrl}/assessment`;

// INTERVIEW
export const INTERVIEW_URL = `${intreviewUrl}/api/interview`;

// USER
export const USER_URL = `${authorizationUrl}/api/authorization/users-role-access`;

export const CANDIDATE_TEST_URL = `${baseUrl}/api/questionSet`;

//Batch
export const BATCH_URL = `${assessmentUrl}/api/assessment/Batch`;
