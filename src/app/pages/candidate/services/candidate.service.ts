/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { CandidateAssessment } from '../models/candidate.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    protected override store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return ASSESSMENT_URL;
    // return apiUrl;
  }

  public getCandidateAssessment() {
    return this.httpClient.get<CandidateAssessment[]>(
      // `${this.getResourceUrl()}/api/assessment/candidate-assessments`
      `${this.getResourceUrl()}/candidate-assessments`,
    );
  }
}
