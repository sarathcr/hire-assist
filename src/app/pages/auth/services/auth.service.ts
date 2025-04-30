import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as Forge from 'node-forge';
import { Observable, Subject, tap } from 'rxjs';
import { LOGIN_URL } from '../../../shared/constants/api';
import {
  initialTokenData,
  TokenData,
} from '../../../shared/models/token-data.models';
import { StoreService } from '../../../shared/services/store.service';
import {
  getTokenPayloadData,
  TokenField,
} from '../../../shared/utilities/token.utility';

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
    private http: HttpClient,
    private storeService: StoreService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public
  public login(loginData: {
    email: string;
    password: string;
  }): Observable<TokenData> {
    const { email, password } = loginData;

    const trimmedLoginData = {
      email: email.trim().toString(),
      password: this.encryptWithPublicKey(password.trim()).toString(),
    };

    return this.http.post<TokenData>(LOGIN_URL, trimmedLoginData).pipe(
      tap((response) => {
        this.initialize(response);
      }),
    );
  }

  /** Initializes User and TokenData in AppState */
  private initialize(response: TokenData): void {
    const { accessToken, refreshToken } = response;

    const error = 'Token error (internal)';
    const status = 422;
    if (accessToken) {
      try {
        this.getUserInfo(accessToken, refreshToken);
      } catch {
        this.storeService.setTokenData(initialTokenData);
        this.router.navigateByUrl('login');
        throw new HttpErrorResponse({ error, status });
      }
    } else {
      console.error(error);
    }
  }

  private getUserInfo(accessToken: string, refreshToken: string) {
    const emailAddress = getTokenPayloadData(
      accessToken,
      TokenField.Emailaddress,
    );
    const name = getTokenPayloadData(accessToken, TokenField.Name);
    const roles = getTokenPayloadData(accessToken, TokenField.Role);
    // roles should now be an array of numbers, e.g., [1, 2]

    if (!roles || !Array.isArray(roles)) {
      console.error('Invalid roles in token:', roles);
    }

    // Store tokens and user information
    this.storeService.setTokenData({ accessToken, refreshToken });

    if (!roles?.length) {
      this.storeService.setUser(emailAddress, name, '');
      return;
    }

    // Store the roles as an array
    this.storeService.setUser(emailAddress, name, roles); // Store roles as [1, 2]
  }

  private encryptWithPublicKey(valueToEncrypt: string): string {
    const rsa = Forge.pki.publicKeyFromPem(this.publicKey);
    return window.btoa(rsa.encrypt(valueToEncrypt.toString()));
  }
}
