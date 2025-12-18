import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ASSESSMENT_URL } from '../../../../../shared/constants/api';


export type StepStatusValue = 'Completed' | 'Active' | 'Pending';

export interface StepStatus {
  rounds:  StepStatusValue;
  questionSets:  StepStatusValue;
  coordinators:  StepStatusValue;
  frontDesk:  StepStatusValue;
  interviewers:  StepStatusValue;
  schedule: StepStatusValue;
}

@Injectable({
  providedIn: 'root'
})
export class StepsStatusService {

  constructor(private readonly httpClient: HttpClient) {}

  public getAssessmentStepsStatus(assessmentId: number) {
    return this.httpClient.get<StepStatus>(
      `${ASSESSMENT_URL}/step-status/${assessmentId}`
    );
  }

}
