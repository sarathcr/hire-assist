/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ASSESSMENT_URL } from '../../../../../shared/constants/api';
import { ApiService } from '../../../../../shared/services/api.service';
import { StoreService } from '../../../../../shared/services/store.service';
import {
  AssessmentRoundsInterface,
  RoundsInterface,
} from '../../../models/assessment-schedule.model';
import { AssessmentRound } from '../../../models/assessment.model';

@Injectable({
  providedIn: 'root',
})
export class AssessmentScheduleService extends ApiService<any> {
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

  public addRound(payload: RoundsInterface) {
    return this.httpClient.post<any>(`${this.getResourceUrl()}/Round`, payload);
  }

  public CreateAssessmentRound(
    payload: AssessmentRoundsInterface[],
    assessmentId: number,
  ) {
    return this.httpClient.put<any>(
      `${this.getResourceUrl()}/AssessmentRound?assessmentId=${assessmentId}`,
      payload,
    );
  }
  public GetAssessmentRound(assessmentId: number) {
    return this.httpClient.get<AssessmentRound[]>(
      `${this.getResourceUrl()}/AssessmentRound/assessmentId?assessmentId=${assessmentId}`,
    );
  }
  public updateAssessmentRound(
    assessmentId: number,
    payload: AssessmentRound[],
  ) {
    return this.httpClient.put<AssessmentRound[]>(
      `${this.getResourceUrl()}/AssessmentRound?assessmentId=${assessmentId}`,
      payload,
    );
  }
}
