import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { ASSESSMENT_URL } from '../../../constants/api';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AssessmentService extends ApiService<any> {
  constructor(
    httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return ASSESSMENT_URL;
  }
}
