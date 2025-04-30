import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { AssessmentRound } from '../models/assessment.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AssessmentService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return ASSESSMENT_URL;
  }
  public getAssessmentRoundByAssessmnetId(id: number) {
    return this.httpClient.get<AssessmentRound[]>(
      //`${this.getResourceUrl()}/api/assessment/candidate-questions`
      `${this.getResourceUrl()}/AssessmentRound/assessmentId?assessmentId=${id}`,
    );
  }


}
