export interface CustomErrorResponse {
  error: ErrorResponse;
}

export interface ErrorResponse {
  businessError: number;
  message: string;
  errorValue: string;
  type: string;
}
