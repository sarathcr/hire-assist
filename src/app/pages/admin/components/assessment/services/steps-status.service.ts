import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private stepStatusUpdateSubject = new Subject<number>();
  public stepStatusUpdate$ = this.stepStatusUpdateSubject.asObservable();

  private stepCompletedSubject = new Subject<number>();
  public stepCompleted$ = this.stepCompletedSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {}

  public getAssessmentStepsStatus(assessmentId: number) {
    return this.httpClient.get<StepStatus>(
      `${ASSESSMENT_URL}/step-status/${assessmentId}`
    ).pipe(
      map((response) => {
        // Filter out interviewers from the response - hidden for now
        const { interviewers, ...filteredResponse } = response;
        // Return the filtered response but keep the StepStatus type
        // The interviewers field will be ignored in the component
        return filteredResponse as StepStatus;
      })
    );
  }

  public notifyStepStatusUpdate(assessmentId: number): void {
    this.stepStatusUpdateSubject.next(assessmentId);
  }

  public notifyStepCompleted(assessmentId: number): void {
    this.stepCompletedSubject.next(assessmentId);
  }

}
