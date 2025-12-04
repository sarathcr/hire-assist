export interface CustomErrorResponse {
  error: ErrorResponse;
}

export interface ErrorResponse {
  businessError: number;
  status:number;
  message: string;
  errorValue: string;
  type: string;
}
