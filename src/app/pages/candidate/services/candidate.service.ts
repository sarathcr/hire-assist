/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, shareReplay } from 'rxjs';
import { StoreService } from '../../../shared/services/store.service';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { CandidateAssessment } from '../models/candidate.model';

@Injectable({
  providedIn: 'root',
})
export class CandidateService extends ApiService<any> {
  private assessmentRequest$: Observable<CandidateAssessment[]> | null = null;

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
    if (this.assessmentRequest$) {
      return this.assessmentRequest$;
    }

    this.assessmentRequest$ = this.httpClient
      .get<CandidateAssessment[]>(
        `${this.getResourceUrl()}/candidate-assessments`,
      )
      .pipe(shareReplay(1));

    // Subscribe to clear the cache when the request completes or errors
    this.assessmentRequest$.subscribe({
      complete: () => {
        this.assessmentRequest$ = null;
      },
      error: () => {
        this.assessmentRequest$ = null;
      },
    });

    return this.assessmentRequest$;
  }
}
