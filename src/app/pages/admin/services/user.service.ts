import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { USER_URL } from '../../../shared/constants/api';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class UserService extends ApiService<any> {
  constructor(
    httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  override getResourceUrl(): string {
    return USER_URL;
  }
}
