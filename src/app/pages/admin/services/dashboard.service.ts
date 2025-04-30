import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { DASHBOARD_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService<T> extends ApiService<T> {
  override getResourceUrl(): string {
    return DASHBOARD_URL;
  }
  constructor(
    httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
}
