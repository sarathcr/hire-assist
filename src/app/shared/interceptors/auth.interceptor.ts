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
  // Do not add Authorization header to external third-party APIs (e.g. ipify) to avoid CORS preflight rejection
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    const isExternal =
      !req.url.includes(window.location.hostname) &&
      !req.url.includes('runasp.net') &&
      !req.url.includes('hire-assist') &&
      !req.url.includes('hireassist');

    if (isExternal) {
      return next(req);
    }
  }

  // Inject the current `AuthService` and use it to get an authentication token:
  const authToken: string = inject(AuthService).getAccessToken();
  if (!authToken) {
    return next(req);
  }

  // Clone the request to add the authentication header.
  const newReq: HttpRequest<unknown> = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return next(newReq);
};
