import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { StepperData } from '../../../models/stepper.model';
import { recruitment } from '../../../../../shared/models/stepper.models';

@Injectable({
  providedIn: 'root',
})
export class StepperService {
  private stepSubject = new BehaviorSubject<StepperData | null>(null);
  public currentStep$: Observable<StepperData | null> =
    this.stepSubject.asObservable();

  private deleteCandidateSubject = new Subject<string>();
  public deleteCandidate$ = this.deleteCandidateSubject.asObservable();

  private advanceStepSubject = new Subject<void>();
  public advanceStep$ = this.advanceStepSubject.asObservable();

  private AssessmentRoundList = new BehaviorSubject<recruitment[] | null>(null);
  public AssessmentRoundList$ = this.AssessmentRoundList.asObservable();


  private CurrentRound = new BehaviorSubject<number | null>(null);
  public CurrentRound$ = this.CurrentRound.asObservable();

  private statusType = new BehaviorSubject<number | null>(null);
  public statusType$ = this.statusType.asObservable();

  public setStep(step: StepperData): void {
    this.stepSubject.next(step);
    console.log("advance step", this.stepSubject)
  }

  public getCurrentStep(): StepperData | null {
    return this.stepSubject.getValue();
  }

  public emitDeleteCandidate(id: string) {
    this.deleteCandidateSubject.next(id);
  }

  public advanceStep(): void {
    this.advanceStepSubject.next();
  }


  setAssessmentRoundList(AssessmentRoundlist: recruitment[]) {
    this.AssessmentRoundList.next(AssessmentRoundlist);

  }

  setCurrentRound(type: number) {
    this.CurrentRound.next(type);

  }
  setFilterType(type: number) {
    this.statusType.next(type);
    console.log('Filter Type in service:', type);

  }
}
