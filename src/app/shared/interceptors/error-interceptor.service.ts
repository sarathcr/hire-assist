/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HttpClient,
  HttpErrorResponse,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';

import { catchError, switchMap, throwError } from 'rxjs';
import { LoginResponse } from '../../modules/auth/models/loginDataModel';
import { REFRESH_TOKEN_URL } from '../../constants/api';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';

const errorList = [
  {
    key: '0',
    value: 'errors.noResponse',
  },
  {
    key: '400',
    value: 'errors.badRequest',
  },
  {
    key: '401',
    value: 'errors.unauthorized',
  },
  {
    key: '404',
    value: 'errors.notFound',
  },
  {
    key: '405',
    value: 'errors.methodNotAllowed',
  },
  {
    key: '409',
    value: 'errors.duplicated',
  },
  {
    key: '413',
    value: 'errors.tooLarge',
  },
  {
    key: '500',
    value: 'errors.internalServer',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ErrorInterceptorService implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private httpClient: HttpClient
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          this.storeService.setIsLoading(false);
          //console.log('intercept HttpErrorResponse', { error, status: error.status });
          return this.errorHandler(req, next, error);
        } else {
          //console.log('intercept', { error, status: error.status });
          return throwError(() => error);
        }
      })
    );
  }

  private errorHandler(req: HttpRequest<any>, next: HttpHandler, error: any) {
    switch (error.status) {
      // If JWT has expired we will recive error 401
      case 401: {
        const { accessToken, refreshToken } = this.storeService.getTokenData();
        const options = { headers: { Authorization: `Bearer ${accessToken}` } };
        return this.httpClient
          .post<LoginResponse>(REFRESH_TOKEN_URL, { refreshToken }, options)
          .pipe(
            switchMap(response => {
              const { data, succeeded } = response;
              const { accessToken: newToken } = data;
              let newReq = req;
              if (succeeded && newToken) {
                //console.log('ErrorInterceptorService --> 401 --> refreshing token success:');
                // Save it
                this.storeService.setTokenData(data);
                // Resend request with refreshed token
                newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                });
              }
              return next.handle(newReq);
            })
          );
      }
      // If JWT refresh token also has expired we will recive error 403
      case 403: {
        //console.log('Forbbiden error 403, logging out . . .');
        // const expMsg = this.translate.instant('errors.tokenExpired');
        // this.snackBarService.openSnackBar(expMsg, false);
        this.exit();
        return throwError(() => error);
      }
      default: {
        this.storeService.setIsLoading(false);
        const isClientSideError = error instanceof ErrorEvent;
        const errorMessage = isClientSideError
          ? `Client-side error: ${error.error.message}`
          : this.getServerErrorMsg(error);
        console.log('errorMessage', errorMessage);

        // Show error message
        // const msg = this.translate.instant(errorMessage);
        // this.snackBarService.openSnackBar(msg, false);
        return throwError(() => error);
      }
    }
  }

  private getServerErrorMsg(error: HttpErrorResponse): string {
    const { status, error: errorMsg } = error;
    if (errorMsg && typeof errorMsg === 'string') return errorMsg;
    const found = errorList.find(x => x.key === `${status}`);
    return found ? found.value : 'errors.unknown';
  }

  private exit() {
    this.storeService.setIsLoading(false);
    this.authService.logout();
  }
}
