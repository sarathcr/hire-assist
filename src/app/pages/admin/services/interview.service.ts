/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { INTERVIEW_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { interviewerInterface } from '../models/interviewers-model';
import { Candidate } from '../models/stepper.model';

@Injectable({
  providedIn: 'root',
})
export class InterviewService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return INTERVIEW_URL;
  }
  public getAssessmentFlow(candidateId: string, assessmentId: number) {
    return this.httpClient.get<Candidate>(
      `${this.getResourceUrl()}/assessmentFlow/candidateId?candidateId=${candidateId}&assessmentId=${assessmentId}`,
    );
  }
  public addInterviewer(payload: interviewerInterface[]) {
    return this.httpClient.post(
      `${this.getResourceUrl()}/InterviewPanel`,
      payload,
    );
  }
}
