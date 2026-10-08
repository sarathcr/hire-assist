/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { CandidateTestQuestionSet } from '../models/candidate-test-question-set.model';

import { catchError, of } from 'rxjs';

export interface Payload {
  id?: number;
  interviewId: number;
  candidateId: string;
  assessmentId: number;
  questionId: number;
  answerOptionId: string | number | null;
  statusId: number;
  duration: string;
  ipAddress?: string;
}
export interface candidateTestTermination {
  candidateId: string;
  assessmentId: number;
  terminatedTime: string;
  timerDuration: string;
  ipAddress?: string;
}
@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CandidateTestService extends ApiService<any> {
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

  public getDeviceIp() {
    return this.httpClient.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
      catchError(() => this.httpClient.get<{ ip: string }>('https://api64.ipify.org?format=json')),
      catchError(() => of({ ip: '' })),
    );
  }

  public getQuestionSet(assessmentId: number, interviewId: number) {
    return this.httpClient.get<CandidateTestQuestionSet>(
      // `${this.getResourceUrl()}/api/assessment/candidate-questions`
      `${this.getResourceUrl()}/candidate-questions?assessmentId=${assessmentId}&interviewId=${interviewId}`,
    );
  }
  public addcandidateAnswer(payload: Payload) {
    return this.httpClient.post<CandidateTestQuestionSet>(
      // `${this.getResourceUrl()}/api/assessment/candidateAnswer`,
      `${this.getResourceUrl()}/candidateAnswer`,
      payload,
    );
  }
  public updateCandidateAnswer(payload: Payload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.httpClient.post<any>(
      // `${this.getResourceUrl()}/api/assessment/candidateAnswer`,
      `${this.getResourceUrl()}/candidateAnswer`,
      payload,
    );
  }
  public getCandidateAnswer(assessmentId: number, candidateId: string, interviewId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.httpClient.get<any>(
      `${this.getResourceUrl()}/candidateAnswer?assessmentId=${assessmentId}&candidateId=${candidateId}&interviewId=${interviewId}`,
      // `${this.getResourceUrl()}/api/assessment/candidateAnswer?assessmentId=${assessmentId}&candidateId=${candidateId}`
    );
  }
  public addCandidateScore(assessmentId: number, assessmentRoundId: number, ipAddress?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.httpClient.post<any>(
      `${this.getResourceUrl()}/calculate-score/assessmentId/${assessmentId}/assessmentRoundId/${assessmentRoundId}`,
      { ipAddress },
    );
  }

  public addcandidateTestTerminationTime(payload: candidateTestTermination) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.httpClient.post<any>(
      `${this.getResourceUrl()}/candidateTermination`,
      payload,
    );
  }

  public getCandidateTestTerminationTime(
    assessmentId: number,
    candidateId: string,
  ) {
    return this.httpClient.get<any>(
      `${this.getResourceUrl()}/candidateTermination/${candidateId}/${assessmentId}`,
    );
  }

  public quitAssessment(candidateId: string, assessmentId: number, ipAddress?: string) {
    return this.httpClient.put<any>(
      `${this.getResourceUrl()}/quitAssessment/${candidateId}/${assessmentId}`,
      { ipAddress },
    );
  }
}
