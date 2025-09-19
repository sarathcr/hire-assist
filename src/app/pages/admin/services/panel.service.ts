import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Panel_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class PanelService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return Panel_URL;
  }
}
