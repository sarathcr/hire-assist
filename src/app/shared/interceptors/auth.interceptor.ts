import { HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

type AuthInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => Observable<HttpEvent<unknown>>;

export const authInterceptor: AuthInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // Inject the current `AuthService` and use it to get an authentication token:
  const authToken: string = inject(AuthService).getAccessToken();
  // Clone the request to add the authentication header.
  const newReq: HttpRequest<unknown> = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return next(newReq);
};
