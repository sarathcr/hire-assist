/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../../../shared/services/store.service';
import { ASSESSMENT_URL } from '../../../../../shared/constants/api';
import {
  AssessmentRoundsInterface,
  RoundsInterface,
} from '../../../models/assessment-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class assessmentScheduleService extends ApiService<any> {
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
    payload: AssessmentRoundsInterface,
    assessmentId: number,
  ) {
    return this.httpClient.put<any>(
      `${this.getResourceUrl()}/AssessmentRound?assessmentId=${assessmentId}`,
      payload,
    );
  }
}
