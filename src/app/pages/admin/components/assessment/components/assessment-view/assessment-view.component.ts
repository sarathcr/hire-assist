/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';
import { Option } from '../../../../../../shared/models/option';
import { CordinatorData } from '../../../../models/assessment-schedule.model';
import { Assessment } from '../../../../models/assessment.model';
import {
  StepStatus,
  StepsStatusService,
} from '../../services/steps-status.service';
import { AssessmentScheduleService } from '../../services/assessment-schedule.service';
import { AssessmentRoundComponent } from './components/assessment-round/assessment-round.component';
import { CoordinatorStepComponent } from './components/coordinator-step/coordinator-step.component';
import { FrontDeskComponent } from './components/front-desk/front-desk.component';
import { ImportCandidateListStepComponent } from './components/import-candidate-list-step/import-candidate-list-step.component';
import { SelectQuesionsetStepComponent } from './components/select-quesionset-step/select-quesionset-step.component';
import { AssessmentService } from '../../../../services/assessment.service';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import { forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export interface AssessmentViewModel {
  id?: string;
  name?: string;
  email?: string;
  batchId?: number;
  batchName?: string;
}

export interface CollectionInterface {
  departments: Option[];
  batches: Option[];
  interviewers: Option[];
  users: Option[];
  rounds: Option[];
  roles: Option[];
  questionType: Option[];
  panels: Option[];
}

export interface RoundModel {
  id?: number;
  assessment?: string;
  isActive?: boolean;
  round: string;
  roundId: number;
  sequence: number;
  status?: string;
  statusId?: number;
  timerHour?: number;
  maxTerminationCount?: number;
}

@Component({
  selector: 'app-assessment-view',
  imports: [
    CommonModule,
    StepperModule,
    ButtonModule,
    TooltipModule,
    SelectQuesionsetStepComponent,
    CoordinatorStepComponent,
    AssessmentRoundComponent,
    FrontDeskComponent,
    ImportCandidateListStepComponent,
  ],

  templateUrl: './assessment-view.component.html',
  styleUrl: './assessment-view.component.scss',
})
export class AssessmentViewComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public assessment!: Assessment;

  public assessmentId!: number;

  public activeStep = 0;
  public completedSteps: number[] = [0];
  public visitedSteps: number[] = [];
  public isdisableCompleted = false;
  public coordinatorData!: CordinatorData;
  public assessmentRounds: RoundModel[] = [];
  public stepsStatus: StepStatus = {
    rounds: 'Pending',
    questionSets: 'Pending',
    coordinators: 'Pending',
    frontDesk: 'Pending',
    interviewers: 'Pending',
    schedule: 'Pending',
  };
  public stepsLoaded = false;
  public stepKeys: (keyof StepStatus)[] = [
    'rounds',
    'questionSets',
    'coordinators',
    'frontDesk',
    'schedule',
  ];
  private isQuestionSetIncomplete = false;

  public stepConfig = [
    {
      index: 0,
      label: 'Rounds',
      description: 'Configure assessment rounds and sequence',
      icon: 'pi pi-list',
    },
    {
      index: 1,
      label: 'Question Set',
      description: 'Select and assign question sets',
      icon: 'pi pi-file-edit',
    },
    {
      index: 2,
      label: 'Coordinators',
      description: 'Assign coordinators for the assessment',
      icon: 'pi pi-users',
    },
    {
      index: 3,
      label: 'Front Desk',
      description: 'Configure front desk coordinators',
      icon: 'pi pi-building',
    },
    {
      index: 4,
      label: 'Schedule',
      description: 'Import candidates and schedule interviews',
      icon: 'pi pi-calendar-clock',
    },
  ];

  private stepStatusUpdateSubscription?: Subscription;
  private stepCompletedSubscription?: Subscription;

  @ViewChild(SelectQuesionsetStepComponent) questionSetStepComponent!: SelectQuesionsetStepComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: DialogService,
    private stepsStatusService: StepsStatusService,
    @Inject(AssessmentScheduleService)
    private assessmentScheduleService: AssessmentScheduleService,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
  ) {
    super();
  }

  ngOnInit(): void {
    if (history.state.assessment) {
      this.assessment = history.state.assessment;
      localStorage.setItem('assessment', JSON.stringify(this.assessment));
    } else {
      const saved = localStorage.getItem('assessment');
      if (saved) {
        this.assessment = JSON.parse(saved);
      }
    }
    if (this.assessment) {
      this.normalizeDates(this.assessment);
    }
    this.getCurrentRouteId();
    this.stepStatusUpdateSubscription =
      this.stepsStatusService.stepStatusUpdate$.subscribe((assessmentId) => {
        if (assessmentId === this.assessmentId) {
          this.loadStepsStatus();
        }
      });

    // Subscribe to step completion events to move to next step
    this.stepCompletedSubscription =
      this.stepsStatusService.stepCompleted$.subscribe((assessmentId) => {
        if (assessmentId === this.assessmentId) {
          this.moveToNextStep();
        }
      });
  }

  override ngOnDestroy(): void {
    if (this.stepStatusUpdateSubscription) {
      this.stepStatusUpdateSubscription.unsubscribe();
    }
    if (this.stepCompletedSubscription) {
      this.stepCompletedSubscription.unsubscribe();
    }
  }
  public onCompleteStep(step: number): void {
    if (!this.completedSteps.includes(step)) {
      this.completedSteps.push(step);
    }
  }

  public setActiveStep(step: number): void {
    // Block ANY navigation away from the Question Set step (step 1)
    // when there are question sets created but not all have been submitted.
    if (this.activeStep === 1 && step !== 1) {
      const comp = this.questionSetStepComponent;
      const hasUnsubmittedSets =
        comp &&
        comp.questionSets.length > 0 &&
        !comp.hasSubmittedQuestionSets();

      if (hasUnsubmittedSets) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please select questions for all created Question Sets before proceeding to other steps.',
        });
        return; // Prevent navigation
      }
    }
    this.activeStep = step;
  }

  public onNextStep(currentStep: number): void {
    const nextStep = currentStep + 1;

    if (this.completedSteps.includes(currentStep)) {
      this.activeStep = nextStep;

      if (!this.visitedSteps.includes(nextStep)) {
        this.visitedSteps.push(nextStep);
      }
    }
  }

  public onStepClick(step: number): void {
    if (this.canActivateStep(step)) {
      this.activeStep = step;

      if (!this.visitedSteps.includes(step)) {
        this.visitedSteps.push(step);
      }
    }
  }

  public onStepChange(event: any): void {
    const newStep = event.value;

    if (this.canActivateStep(newStep)) {
      this.activeStep = newStep;

      if (!this.visitedSteps.includes(newStep)) {
        this.visitedSteps.push(newStep);
      }
    }
  }

  public canActivateStep(step: number): boolean {
    if (step === 1) {
      return true;
    }

    // If question set is incomplete, block any step beyond index 1
    if (this.isQuestionSetIncomplete && step > 1) {
      return false;
    }

    const canActivate = this.completedSteps.includes(step - 1);
    return canActivate;
  }

  public getStatus(statusId: number): string {
    return StatusEnum[statusId] || 'Unknown Status';
  }

  private getCurrentRouteId() {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      this.assessmentId = idParam ? Number(idParam) : 0;
      if (this.assessmentId) {
        this.loadStepsStatus();
      }
    });
  }

  public loadStepsStatus(): void {
    if (this.assessmentId) {
      this.stepsStatusService
        .getAssessmentStepsStatus(this.assessmentId)
        .pipe(
          switchMap((response) => {
            this.stepsStatus = response;
            this.stepsLoaded = true;

            // If questionSets is marked as Completed, verify it's actually finished
            if (this.stepsStatus.questionSets === 'Completed') {
              const payload = new PaginatedPayload();
              payload.filterMap = { assessmentId: this.assessmentId };
              payload.pagination.pageSize = -1;

              return this.assessmentService.paginationEntity<any>('QuestionSetSummary', payload).pipe(
                switchMap((res) => {
                  const questionSets = res.data || [];
                  if (questionSets.length === 0) {
                    this.isQuestionSetIncomplete = true;
                    return of(null);
                  }

                  // For each set, check if it has questions
                  const questionChecks = questionSets.map((set: any) =>
                    this.assessmentService.getQuestionsBySet(set.id.toString())
                  );

                  return forkJoin(questionChecks).pipe(
                    map((results: any[]) => {
                      this.isQuestionSetIncomplete = results.some(
                        (res) => !res.questions || res.questions.length === 0
                      );
                      if (this.isQuestionSetIncomplete) {
                        this.stepsStatus.questionSets = 'Active';
                        // Force later steps back to Pending to land on Question Set and block navigation
                        this.stepsStatus.coordinators = 'Pending';
                        this.stepsStatus.frontDesk = 'Pending';
                        this.stepsStatus.schedule = 'Pending';
                      }
                      return null;
                    })
                  );
                })
              );
            } else {
              this.isQuestionSetIncomplete = false;
              return of(null);
            }
          })
        )
        .subscribe({
          next: () => {
            this.loadAssessmentRounds();
            this.setActiveStepFromStatus();
          },
          error: () => {
            // Error handling
          },
        });
    }
  }

  private setActiveStepFromStatus(): void {
    if (!this.stepsStatus || !this.stepsLoaded) return;

    // Find the step with 'Active' status
    for (let i = 0; i < this.stepKeys.length; i++) {
      const key = this.stepKeys[i];
      if (this.stepsStatus[key] === 'Active') {
        this.activeStep = i;
        return;
      }
    }

    // If no active step found, find the first pending step
    for (let i = 0; i < this.stepKeys.length; i++) {
      const key = this.stepKeys[i];
      if (this.stepsStatus[key] === 'Pending') {
        this.activeStep = i;
        return;
      }
    }

    // If all steps are completed, stay on the last step
    const allCompleted = this.stepKeys.every(
      (key) => this.stepsStatus[key] === 'Completed',
    );
    if (allCompleted) {
      this.activeStep = this.stepKeys.length - 1;
    }
  }

  public loadAssessmentRounds(): void {
    if (this.assessmentId) {
      this.assessmentScheduleService
        .GetAssessmentRound(this.assessmentId)
        .subscribe({
          next: (response: RoundModel[]) => {
            this.assessmentRounds = response;
          },
          error: () => {
            // Error handling
          },
        });
    }
  }

  public moveToNextStep(): void {
    if (this.assessmentId) {
      // Reload step status to get updated status
      this.stepsStatusService
        .getAssessmentStepsStatus(this.assessmentId)
        .subscribe({
          next: (response) => {
            this.stepsStatus = response;
            this.loadAssessmentRounds();
            // Find the next active step
            this.setActiveStepFromStatus();
          },
          error: () => {
            // Error handling - try to move to next step anyway
            if (this.activeStep < this.stepConfig.length - 1) {
              this.activeStep = this.activeStep + 1;
            }
          },
        });
    }
  }

  public isStepEnabled(stepIndex: number): boolean {
    if (!this.stepsLoaded || !this.stepsStatus) return false;

    // If question set is incomplete, block all steps after index 1
    if (this.isQuestionSetIncomplete && stepIndex > 1) {
      return false;
    }

    const key = this.stepKeys[stepIndex];
    if (!key) return false;
    const status = this.stepsStatus[key];
    return status === 'Active' || status === 'Completed';
  }

  private getStepKey(stepIndex: number): keyof StepStatus | null {
    if (stepIndex < 0 || stepIndex >= this.stepKeys.length) return null;
    return this.stepKeys[stepIndex];
  }

  private normalizeDates(assessment: Assessment): void {
    if (assessment.startDateTime) {
      assessment.startDateTime = this.parseDate(assessment.startDateTime) || '';
    }
    if (assessment.endDateTime) {
      assessment.endDateTime = this.parseDate(assessment.endDateTime) || '';
    }
  }
  private parseDate(date: string): string | null {
    if (!date) return null;

    const parts = date.split('-');

    if (parts.length === 3 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const customDate = new Date(year, month, day);

      if (
        customDate.getFullYear() === year &&
        customDate.getMonth() === month &&
        customDate.getDate() === day
      ) {
        return customDate.toISOString();
      }
    }

    const isoDate = new Date(date);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString();
    }

    return null;
  }

  public get isSchedulingConfigReadOnly(): boolean {
    return this.stepsLoaded && this.stepsStatus?.schedule === 'Completed';
  }

  public get isCandidateSchedulingReadOnly(): boolean {
    const areAllRoundsFinished =
      this.assessmentRounds.length > 0 &&
      this.assessmentRounds.every(
        (r) => r.status?.toLowerCase() === 'completed',
      );

    return this.isSchedulingConfigReadOnly && areAllRoundsFinished;
  }

  public getProgressPercentage(): number {
    if (!this.stepsLoaded || !this.stepsStatus) return 0;
    const totalSteps = this.stepKeys.length;
    const completedSteps = this.stepKeys.filter(
      (key) => this.stepsStatus[key] === 'Completed',
    ).length;
    return Math.round((completedSteps / totalSteps) * 100);
  }
}
