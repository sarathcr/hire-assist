import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, EMPTY, Subject, take } from 'rxjs';

import { StoreService } from '../services/store.service';
import { REFRESH_TOKEN_URL } from '../constants/api';
import { AuthService } from '../services/auth.service';
import { CustomErrorResponse } from '../models/custom-error.models';
import { CollectionService } from '../services/collection.service';
import { MessageService } from 'primeng/api';
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

let isSessionExpiredToastShown = false;
let isRefreshing = false;
let refreshTokenSubject = new Subject<string>();

const showSessionExpiredToast = (messageService: MessageService, detail?: string) => {
  if (!isSessionExpiredToastShown) {
    isSessionExpiredToastShown = true;
    messageService.add({
      severity: 'error',
      summary: 'Session Expired',
      detail: detail || 'Your session has expired. Please log in again.',
    });
    setTimeout(() => {
      isSessionExpiredToastShown = false;
    }, 5000);
  }
};

export const errorInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const storeService = inject(StoreService);
  const httpClient = inject(HttpClient);
  const messageService = inject(MessageService);
  const collectionService = inject(CollectionService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        storeService.setIsLoading(false);

        return handleError(
          req,
          next,
          error as unknown as CustomErrorResponse,
          authService,
          storeService,
          httpClient,
          messageService,
          collectionService,
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
  messageService: MessageService,
  collectionService: CollectionService,
): Observable<HttpEvent<unknown>> => {
  const status = (error as any).status || error.error?.status;
  if (status === 401 && error.error?.businessError !== 5000) {
    storeService.setIsLoading(false);
    if (!req.url.includes('/login') && !req.url.includes('/refresh-token')) {
      showSessionExpiredToast(messageService, error.error?.type);
      authService.logout();
      return EMPTY;
    }
    return throwError(() => error);
  }
  if (status === 403) {
    storeService.setIsLoading(false);
    messageService.add({ severity: 'error', summary: 'Access Denied', detail: error.error?.type || 'You do not have permission to perform this action.' });
    authService.logout();
    return EMPTY;  
  }
  switch (error.error.businessError) {
    case 5000: {
      if (!isRefreshing) {
        isRefreshing = true;
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
              isRefreshing = false;
              if (response && response?.accessToken) {
                const newToken = response.accessToken;
                storeService.setAccessTokenData(response.accessToken);
                collectionService.getCollection();
                refreshTokenSubject.next(newToken);
                const newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                });

                return next(newReq);
              }
              const err = new Error('Token refresh failed');
              refreshTokenSubject.error(err);
              refreshTokenSubject = new Subject<string>();
              authService.logout();
              showSessionExpiredToast(messageService, error.error?.type);
              return EMPTY;
            }),
            catchError((err) => {
              isRefreshing = false;
              refreshTokenSubject.error(err);
              refreshTokenSubject = new Subject<string>();
              authService.logout();
              showSessionExpiredToast(messageService, error.error?.type);
              return EMPTY;
            })
          );
      } else {
        return refreshTokenSubject.pipe(
          take(1),
          switchMap((newToken) => {
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(newReq);
          })
        );
      }
    }
    case 5003:
    case 5009: {
      showSessionExpiredToast(messageService, error.error?.type);
      authService.logout();
      return EMPTY;
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
