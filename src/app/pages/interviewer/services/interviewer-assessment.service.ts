import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { ApiService } from '../../../shared/services/api.service';
import { ASSESSMENT_URL } from '../../../shared/constants/api';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InterviewerAssessmentService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return `${ASSESSMENT_URL}/AssessmentSummaryInterviewer`;
  }
}
