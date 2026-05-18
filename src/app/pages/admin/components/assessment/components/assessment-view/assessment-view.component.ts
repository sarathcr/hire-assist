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
import type { Option } from '../../../../../../shared/models/option';
import { CordinatorData } from '../../../../models/assessment-schedule.model';
import { Assessment, RoundModel } from '../../../../models/assessment.model';
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
import { forkJoin, of, Observable } from 'rxjs';
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
  public completedSteps: number[] = [];
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
  public isQuestionSetIncomplete = false;

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

  public get hasOnlineAptitudeRound(): boolean {
    return this.assessmentRounds.some((r) => r.roundTypeId === 1);
  }

  public get filteredStepConfig() {
    if (!this.stepsLoaded) return [this.stepConfig[0]];

    if (this.assessmentRounds.length === 0) {
      return [this.stepConfig[0]];
    }

    return this.stepConfig.filter((step) => {
      if (step.index === 1 || step.index === 2) {
        return this.hasOnlineAptitudeRound;
      }
      return true;
    });
  }

  public get filteredStepKeys(): (keyof StepStatus)[] {
    if (!this.stepsLoaded) return ['rounds'];

    if (this.assessmentRounds.length === 0) {
      return ['rounds'];
    }

    return this.stepKeys.filter((key, index) => {
      if (index === 1 || index === 2) {
        return this.hasOnlineAptitudeRound;
      }
      return true;
    });
  }

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
          this.loadStepsStatus(false);
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
      
      // 1. Block EVERYTHING if server-side check says sets are incomplete
      if (this.hasOnlineAptitudeRound && this.isQuestionSetIncomplete) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please create question sets and add questions in each set under the rounds before leaving.',
        });
        return;
      }

      if (comp) {
        // 2. Block only FORWARD navigation if rounds are missing sets
        if (step > 1 && !comp.hasAllRoundsConfigured) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please create at least one question set for every assessment round and add questions before proceeding.',
          });
          return;
        }
      }
    }
    this.activeStep = step;
    if (!this.visitedSteps.includes(step)) {
      this.visitedSteps.push(step);
    }
  }

  public onNextStep(currentStep: number): void {
    const currentConfig = this.filteredStepConfig;
    const currentIndex = currentConfig.findIndex((s) => s.index === currentStep);

    if (currentIndex !== -1 && currentIndex < currentConfig.length - 1) {
      const nextStep = currentConfig[currentIndex + 1].index;

      if (this.completedSteps.includes(currentStep)) {
        this.activeStep = nextStep;

        if (!this.visitedSteps.includes(nextStep)) {
          this.visitedSteps.push(nextStep);
        }
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

  public canActivateStep(stepIndex: number): boolean {
    const currentConfig = this.filteredStepConfig;
    const itemIndex = currentConfig.findIndex((s) => s.index === stepIndex);

    if (itemIndex <= 0) return true;

    // If question set is incomplete, block any step beyond index 1
    if (this.isQuestionSetIncomplete && stepIndex > 1) {
      return false;
    }

    const prevStep = currentConfig[itemIndex - 1];
    const prevStatus = this.stepsStatus[this.stepKeys[prevStep.index]];
    const canActivate =
      this.completedSteps.includes(prevStep.index) ||
      prevStatus === 'Completed' ||
      prevStatus === 'Active';

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

  public loadStepsStatus(shouldUpdateActiveStep: boolean = true): void {
    if (this.assessmentId) {
      // 1. Load Rounds first so we know if Aptitude logic applies
      this.assessmentScheduleService
        .GetAssessmentRound(this.assessmentId)
        .pipe(
          switchMap((rounds: RoundModel[]) => {
            this.assessmentRounds = rounds;
            // 2. Load Step Status
            return this.stepsStatusService.getAssessmentStepsStatus(
              this.assessmentId,
            );
          }),
          switchMap((statusResponse) => {
            this.stepsStatus = statusResponse;
            this.stepsLoaded = true;
            this.updateCompletedStepsFromStatus();

            let checkObservable: Observable<any> = of(null);

            // 3. Perform Question Set validation ONLY if Aptitude rounds exist
            if (this.hasOnlineAptitudeRound) {
              const payload = new PaginatedPayload();
              payload.filterMap = { assessmentId: this.assessmentId };
              payload.pagination.pageSize = -1;

              checkObservable = this.assessmentService
                .paginationEntity<any>('QuestionSetSummary', payload)
                .pipe(
                  switchMap((res) => {
                    const questionSets = res.data || [];
                    if (questionSets.length === 0) {
                      this.isQuestionSetIncomplete = true;
                      return of(null);
                    }

                    const questionChecks = questionSets.map((set: any) =>
                      this.assessmentService.getQuestionsBySet(
                        set.id.toString(),
                      ),
                    );

                    return forkJoin(questionChecks).pipe(
                      map((results: any[]) => {
                        this.isQuestionSetIncomplete = results.some(
                          (res) => !res.questions || res.questions.length === 0,
                        );
                        if (this.isQuestionSetIncomplete) {
                          this.stepsStatus.questionSets = 'Active';
                          this.stepsStatus.coordinators = 'Pending';
                          this.stepsStatus.frontDesk = 'Pending';
                          this.stepsStatus.schedule = 'Pending';
                        }
                        return null;
                      }),
                    );
                  }),
                );
            } else {
              this.isQuestionSetIncomplete = false;
            }

            return checkObservable;
          }),
        )
        .subscribe({
          next: () => {
            if (shouldUpdateActiveStep) {
              this.setActiveStepFromStatus();
            }
          },
          error: () => {
            // Error handling
          },
        });
    }
  }

  private updateCompletedStepsFromStatus(): void {
    if (!this.stepsStatus) return;
    this.completedSteps = [];
    this.stepKeys.forEach((key, index) => {
      if (this.stepsStatus[key] === 'Completed') {
        this.completedSteps.push(index);
      }
    });
  }

  private setActiveStepFromStatus(): void {
    if (!this.stepsStatus || !this.stepsLoaded) return;

    const currentKeys = this.filteredStepKeys;

    // Find the step with 'Active' status
    for (const key of currentKeys) {
      if (this.stepsStatus[key] === 'Active') {
        this.activeStep = this.stepKeys.indexOf(key);
        return;
      }
    }

    // If no active step found, find the first pending step
    for (const key of currentKeys) {
      if (this.stepsStatus[key] === 'Pending') {
        this.activeStep = this.stepKeys.indexOf(key);
        return;
      }
    }

    // If all steps are completed, stay on the last step
    const allCompleted = currentKeys.every(
      (key) => this.stepsStatus[key] === 'Completed',
    );
    if (allCompleted && currentKeys.length > 0) {
      this.activeStep = this.stepKeys.indexOf(
        currentKeys[currentKeys.length - 1],
      );
    }

    if (!this.visitedSteps.includes(this.activeStep)) {
      this.visitedSteps.push(this.activeStep);
    }
  }


  public moveToNextStep(): void {
    this.loadStepsStatus(true);
  }

  public isStepEnabled(stepIndex: number): boolean {
    if (!this.stepsLoaded || !this.stepsStatus) return false;

    // If question set is incomplete, block all steps after index 1
    if (this.isQuestionSetIncomplete && stepIndex > 1) {
      return false;
    }

    if (stepIndex === this.activeStep || this.visitedSteps.includes(stepIndex)) {
      return true;
    }

    const key = this.stepKeys[stepIndex];
    if (!key) return false;
    const status = this.stepsStatus[key];

    // Check if it's explicitly active/completed or if it can be activated based on previous steps
    return (
      status === 'Active' ||
      status === 'Completed' ||
      this.canActivateStep(stepIndex)
    );
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
    const currentKeys = this.filteredStepKeys;
    const totalSteps = currentKeys.length;
    if (totalSteps === 0) return 0;

    const completedSteps = currentKeys.filter(
      (key) => this.stepsStatus[key] === 'Completed',
    ).length;
    return Math.round((completedSteps / totalSteps) * 100);
  }
}
