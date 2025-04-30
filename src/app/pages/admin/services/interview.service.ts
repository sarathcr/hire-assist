import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { INTERVIEW_URL } from '../../../shared/constants/api';
import { AssessmentRound } from '../models/assessment.model';
import { Candidate } from '../models/stepper.model';

@Injectable({
  providedIn: 'root'
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
    console.log('idin api call ');
    return this.httpClient.get<Candidate>(
      //`${this.getResourceUrl()}/api/assessment/candidate-questions`
      `${this.getResourceUrl()}/assessmentFlow/candidateId?candidateId=${candidateId}&assessmentId=${assessmentId}`
    );
  }
}
