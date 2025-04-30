import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { StoreService } from '../services/store.service';
import { REFRESH_TOKEN_URL } from '../constants/api';
import { AuthService } from '../services/auth.service';
import { CustomErrorResponse } from '../models/custom-error.models';
interface RefreshTokenResponse {
  accessToken: string;
}

const errorList = new Map([
  [0, 'errors.noResponse'],
  [400, 'errors.badRequest'],
  [401, 'errors.unauthorized'],
  [404, 'errors.notFound'],
  [405, 'errors.methodNotAllowed'],
  [409, 'errors.duplicated'],
  [413, 'errors.tooLarge'],
  [500, 'errors.internalServer'],
]);

export const errorInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const storeService = inject(StoreService);
  const httpClient = inject(HttpClient);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        storeService.setIsLoading(false);
        console.log('Intercepted HttpErrorResponse:', {
          error,
          status: error.status,
        });

        return handleError(
          req,
          next,
          error,
          authService,
          storeService,
          httpClient,
        );
      } else {
        return throwError(() => error);
      }
    }),
  );
};

const handleError = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  error: CustomErrorResponse,
  authService: AuthService,
  storeService: StoreService,
  httpClient: HttpClient,
): Observable<HttpEvent<unknown>> => {
  switch (error.error.businessError) {
    case 5000: {
      const { accessToken, refreshToken } = storeService.getTokenData();
      const options = { headers: { Authorization: `Bearer ${accessToken}` } };

      return httpClient
        .post<RefreshTokenResponse>(
          REFRESH_TOKEN_URL,
          { refreshToken },
          options,
        )
        .pipe(
          switchMap((response) => {
            if (response && response?.accessToken) {
              const newToken = response.accessToken;
              storeService.setAccessTokenData(response.accessToken);

              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });

              return next(newReq);
            }
            return throwError(() => error);
          }),
        );
    }
    case 403: {
      console.log('Forbidden error 403, logging out . . .');
      authService.logout();
      return throwError(() => error);
    }
    case 5003: {
      console.log('Refresh Token is Invalid or Expired');
      authService.logout();
      return throwError(() => error);
    }
    default: {
      storeService.setIsLoading(false);
      const errorMessage =
        error.error instanceof ErrorEvent
          ? `Client-side error: ${error.error.message}`
          : getServerErrorMessage(error);

      console.log('Error Message:', errorMessage);
      return throwError(() => error);
    }
  }
};

const getServerErrorMessage = (error: CustomErrorResponse): string => {
  return errorList.get(error.error.businessError) ?? 'errors.unknown';
};
