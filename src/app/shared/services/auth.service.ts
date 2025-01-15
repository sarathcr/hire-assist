import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { StoreService } from './store.service';
import { Router } from '@angular/router';
import { LoginResponse } from '../../modules/auth/models/loginDataModel';
import * as Forge from 'node-forge';
import { LOGIN_URL } from '../../constants/api';
import { initialTokenData, TokenData } from '../models/token-data.models';
import {
  checkAppAndRole,
  getTokenNumericPayloadData,
  getTokenPayloadData,
  TokenField,
} from '../utilities/token.utility';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private publicKey = `-----BEGIN PUBLIC KEY-----
MFswDQYJKoZIhvcNAQEBBQADSgAwRwJAUZi6RccERx8fmXSvwa9+qOYI7Dmu7E4w
x6bVCEwJyj6qnH8mdFtDZKp/ePT+lDgwi2LwYAEhXbbBsEqS1wgC2QIDAQAB
-----END PUBLIC KEY-----`;
  private destroy$ = new Subject<void>();
  constructor(
    private storeService: StoreService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Gets the accessToken  */
  public getAccessToken(): string {
    const { accessToken } = this.storeService.getTokenData();
    return accessToken;
  }

  public login(loginData: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    const { email, password } = loginData;
    const trimmedLoginData = {
      username: this.encryptWithPublicKey(email.trim()).toString(),
      password: this.encryptWithPublicKey(password.trim()).toString(),
    };

    return this.http.post<LoginResponse>(LOGIN_URL, trimmedLoginData).pipe(
      tap(response => {
        this.initialize(response);
      })
    );
  }

  public logout(): void {
    this.storeService.reset();
    this.router.navigateByUrl('/login');
  }

  //   Private
  /** Initializes User and TokenData in AppState */
  private initialize(response: LoginResponse): void {
    const { data: tokenData, succeeded, errors } = response;
    const { accessToken } = tokenData;
    const error = 'Token error (internal)';
    const status = 422;
    if (succeeded && accessToken) {
      try {
        this.getUserInfo(accessToken, tokenData, error, status);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        this.storeService.setTokenData(initialTokenData);
        this.router.navigateByUrl('login');
        throw new HttpErrorResponse({ error, status });
      }
    }

    if (errors && errors.length) {
      console.error(errors);
    }
  }

  private getUserInfo(
    accessToken: string,
    tokenData: TokenData,
    error: string,
    status: number
  ) {
    const userId = getTokenPayloadData(accessToken, TokenField.UserId);
    const userName = getTokenPayloadData(accessToken, TokenField.UserName);
    const role = getTokenPayloadData(accessToken, TokenField.Role);
    const preferedDepartamentId = getTokenNumericPayloadData(
      accessToken,
      TokenField.PreferedDepartamentId
    );
    const authorisation = checkAppAndRole(
      typeof role === 'string' ? [role] : role
    );
    this.storeService.setTokenData(tokenData);

    if (!authorisation?.authoirsedUser) {
      error = 'Unauthorised User';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      status = 403;
    }
    this.storeService.setUser(
      userId,
      userName,
      authorisation.role,
      authorisation.application,
      preferedDepartamentId
    );
    // this.roleService
    //   .getPermissions()
    //   .pipe(
    //     tap(permissions => {
    //       this.storeService.setPermissions(permissions);
    //     }),
    //     catchError(err => {
    //       this.storeService.setPermissions([]);
    //       console.error('Error al obtener roles o guardarlos', err);
    //       return throwError(() => err);
    //     }),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe();
  }

  private encryptWithPublicKey(valueToEncrypt: string): string {
    const rsa = Forge.pki.publicKeyFromPem(this.publicKey);
    return window && window.btoa(rsa.encrypt(valueToEncrypt.toString()));
  }
}
