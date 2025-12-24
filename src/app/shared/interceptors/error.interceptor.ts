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
import { CollectionService } from '../services/collection.service';
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
  if (error.error.status === 401) {
  storeService.setIsLoading(false);
  authService.logout();
  return throwError(() => error);
}
if (error.error.status === 403) {
      storeService.setIsLoading(false);
      authService.logout();
      return throwError(() => error);  
}
  switch (error.error.businessError) {
    case 5000: {
      const collectionService = inject(CollectionService);
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
              collectionService.getCollection();
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });

              return next(newReq);
            }
            return throwError(() => error);
          }),
        );
    }
    case 5003: {
      authService.logout();
      return throwError(() => error);
    }
    default: {
      storeService.setIsLoading(false);
      return throwError(() => error);
    }
  }
};

const getServerErrorMessage = (error: CustomErrorResponse): string => {
  return errorList.get(error.error.businessError) ?? 'errors.unknown';
};
