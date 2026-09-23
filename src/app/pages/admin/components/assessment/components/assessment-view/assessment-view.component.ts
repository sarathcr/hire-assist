/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { MessageService, MenuItem } from 'primeng/api';
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
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InnerSidebarComponent } from '../../../../../../shared/components/inner-sidebar/inner-sidebar.component';
import { InnerSideBarSkeletonComponent } from '../../../../../../shared/components/inner-sidebar/inner-sidebar-skeleton';

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

import { SkeletonModule } from 'primeng/skeleton';

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
    SkeletonModule,
    InnerSidebarComponent,
    InnerSideBarSkeletonComponent,
  ],

  templateUrl: './assessment-view.component.html',
  styleUrl: './assessment-view.component.scss',
})
export class AssessmentViewComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public showHoverTooltip = false;
  public tooltipX = 0;
  public tooltipY = 0;
  public tooltipPositionBelow = false;
  private currentHoveredElement: HTMLElement | null = null;

  public assessment!: Assessment;

  public assessmentId!: number;

  public activeStep = -1;
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
  public isStepUpdating = false;
  public hasModifiedQuestionSetAfterComplete = false;
  public isCoordinatorIncomplete = false;
  private lastProgressPercentage = 0;
  private initialPassedStatus?: StepStatus;
  public stepKeys: (keyof StepStatus)[] = [
    'rounds',
    'questionSets',
    'coordinators',
    'frontDesk',
    'schedule',
  ];
  public isQuestionSetIncomplete = false;
  public isFrontDeskIncomplete = false;

  public stepConfig = [
    {
      index: 0,
      label: 'Rounds',
      description: 'Configure assessment rounds and sequence',
      icon: 'pi pi-step-forward',
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

  public get onlyHasAptitudeRounds(): boolean {
    return this.assessmentRounds.length > 0 && this.assessmentRounds.every((r) => r.roundTypeId === 1);
  }

  public get filteredStepConfig() {
    if (this.assessmentRounds.length === 0) {
      return [this.stepConfig[0]];
    }

    return this.stepConfig.filter((step) => {
      if (step.index === 1) {
        return this.hasOnlineAptitudeRound;
      }
      if (step.index === 2) {
        return !this.onlyHasAptitudeRounds;
      }
      return true;
    });
  }

  public get filteredStepKeys(): (keyof StepStatus)[] {
    if (this.assessmentRounds.length === 0) {
      return ['rounds'];
    }

    return this.stepKeys.filter((key, index) => {
      if (index === 1) {
        return this.hasOnlineAptitudeRound;
      }
      if (index === 2) {
        return !this.onlyHasAptitudeRounds;
      }
      return true;
    });
  }

  public stepMenuItems: MenuItem[] = [
    {
      label: 'Rounds',
      icon: 'pi pi-step-forward',
      index: 0,
      disabled: false,
      tooltip: 'Rounds: Configure assessment rounds and sequence',
    },
  ];

  public updateStepMenuItems(): void {
    this.stepMenuItems = this.filteredStepConfig.map((step) => {
      const key = this.stepKeys[step.index];
      const isCompleted =
        this.stepsLoaded &&
        this.stepsStatus &&
        this.stepsStatus[key] === 'Completed';
      const isEnabled = this.stepsLoaded && this.isStepEnabled(step.index);

      let tooltipText = step.description;
      if (!isEnabled) {
        tooltipText = `${step.label}: Complete previous steps to unlock`;
      } else if (isCompleted) {
        tooltipText = `${step.label}: ${step.description} (Completed)`;
      } else {
        tooltipText = `${step.label}: ${step.description}`;
      }

      return {
        label: step.label,
        icon: step.icon,
        index: step.index,
        disabled: !isEnabled,
        tooltip: tooltipText,
        ['completed']: isCompleted,
      };
    });
  }

  public onStepSelect(item: MenuItem): void {
    const itemIndex = item ? (item['index'] as number | undefined) : undefined;
    if (itemIndex !== undefined) {
      this.setActiveStep(itemIndex);
    }
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
    if (history?.state?.assessment) {
      this.assessment = history.state.assessment;
      localStorage.setItem('assessment', JSON.stringify(this.assessment));
    } else {
      const saved = localStorage.getItem('assessment');
      if (saved) {
        this.assessment = JSON.parse(saved);
      }
    }

    // Reuse steps status if passed via navigation state to avoid redundant API call
    if (history?.state?.stepsStatus) {
      this.initialPassedStatus = history.state.stepsStatus;
      this.stepsStatus = history.state.stepsStatus;
    }
    if (this.assessment) {
      this.normalizeDates(this.assessment);
    }
    this.getCurrentRouteId();
    this.updateStepMenuItems();
    this.stepStatusUpdateSubscription =
      this.stepsStatusService.stepStatusUpdate$.subscribe((assessmentId) => {
        if (assessmentId === this.assessmentId) {
          if (this.activeStep === 1) {
            this.hasModifiedQuestionSetAfterComplete = true;
          }
          if (this.activeStep === 0) {
            this.assessmentRounds = [];
          }
          this.loadStepsStatus(false);
        }
      });

    // Subscribe to step completion events to move to next step
    this.stepCompletedSubscription =
      this.stepsStatusService.stepCompleted$.subscribe((assessmentId) => {
        if (assessmentId === this.assessmentId) {
          this.hasModifiedQuestionSetAfterComplete = false;
          if (this.activeStep === 0) {
            this.assessmentRounds = [];
          }
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
      this.updateStepMenuItems();
    }
  }

  private lastStepWarningTime = 0;

  public setActiveStep(step: number): void {
    if (this.isStepUpdating) return;
    if (this.activeStep === step) return;

    const now = Date.now();
    const canShowWarning = now - this.lastStepWarningTime > 600;

    // Block if coordinator assignment is incomplete and navigating past step 2
    if (this.isCoordinatorIncomplete && step > 2) {
      if (canShowWarning) {
        this.lastStepWarningTime = now;
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please assign coordinators to all recruitment rounds before proceeding.',
        });
      }
      return;
    }

    // Block if front desk coordinator assignment is incomplete and navigating past step 3
    if (this.isFrontDeskIncomplete && step > 3) {
      if (canShowWarning) {
        this.lastStepWarningTime = now;
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please assign front desk coordinators before proceeding.',
        });
      }
      return;
    }

    // Block forward navigation away from the Question Set step (step 1)
    // when rounds are incomplete. Backward navigation (to Rounds step) is allowed.
    if (this.activeStep === 1 && step > 1) {
      const comp = this.questionSetStepComponent;
      
      // 1. Block forward navigation if server-side check says sets are incomplete
      if (this.hasOnlineAptitudeRound && this.isQuestionSetIncomplete) {
        if (canShowWarning) {
          this.lastStepWarningTime = now;
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'Please create question sets and add questions in each set under the rounds before proceeding.',
          });
        }
        return;
      }

      if (comp) {
        // Block if we have modified question sets and haven't clicked Complete yet
        if (step > 1 && this.hasModifiedQuestionSetAfterComplete) {
          if (canShowWarning) {
            this.lastStepWarningTime = now;
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Please click "Complete Question Set Step" to complete the step before proceeding.',
            });
          }
          return;
        }

        // Block if step has unsaved changes/modifications
        if (comp.isDirty) {
          if (canShowWarning) {
            this.lastStepWarningTime = now;
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Please save or complete the current Question Set before proceeding.',
            });
          }
          return;
        }

        // 2. Block only FORWARD navigation if rounds are missing sets
        if (step > 1 && !comp.hasAllRoundsConfigured) {
          if (canShowWarning) {
            this.lastStepWarningTime = now;
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Please create at least one question set for every assessment round and add questions before proceeding.',
            });
          }
          return;
        }
      }
    }
    this.activeStep = step;
    if (!this.visitedSteps.includes(step)) {
      this.visitedSteps.push(step);
    }
    this.updateStepMenuItems();
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
    if (this.isStepUpdating) return false;

    const currentConfig = this.filteredStepConfig;
    const itemIndex = currentConfig.findIndex((s) => s.index === stepIndex);

    if (itemIndex <= 0) return true;

    // If question set is incomplete, block any step beyond index 1
    if (this.isQuestionSetIncomplete && stepIndex > 1) {
      return false;
    }

    // Block if child component has dirty/unsaved changes
    if (this.questionSetStepComponent?.isDirty && stepIndex > 1) {
      return false;
    }

    // Block if we have modified question sets and haven't clicked Complete yet
    if (this.hasModifiedQuestionSetAfterComplete && stepIndex > 1) {
      return false;
    }

    // If coordinator assignment is incomplete, block any step beyond index 2
    if (this.isCoordinatorIncomplete && stepIndex > 2) {
      return false;
    }

    // If front desk assignment is incomplete, block any step beyond index 3
    if (this.isFrontDeskIncomplete && stepIndex > 3) {
      return false;
    }

    const prevStep = currentConfig[itemIndex - 1];
    const prevStatus = this.stepsStatus[this.stepKeys[prevStep.index]];
    const canActivate =
      this.completedSteps.includes(prevStep.index) ||
      prevStatus === 'Completed';

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
        // Validate assessment loaded from state/localStorage
        if (!this.assessment || Number(this.assessment.id) !== this.assessmentId) {
          this.assessmentService.getEntityById(this.assessmentId).subscribe({
            next: (assessment: Assessment) => {
              this.assessment = assessment;
              localStorage.setItem('assessment', JSON.stringify(this.assessment));
              this.normalizeDates(this.assessment);
            }
          });
        }

        const passedStatus = this.initialPassedStatus;
        this.initialPassedStatus = undefined;
        this.loadStepsStatus(true, passedStatus);
      }
    });
  }

  public loadStepsStatus(shouldUpdateActiveStep: boolean = true, providedStatus?: StepStatus): void {
    if (!this.assessmentId) return;

    if (shouldUpdateActiveStep) {
      this.isStepUpdating = true;
    }

    // Use provided status if available, otherwise fetch from API
    const statusObs: Observable<StepStatus> = providedStatus 
      ? of(providedStatus) 
      : this.stepsStatusService.getAssessmentStepsStatus(this.assessmentId);

    // Load rounds from API only if not loaded yet or active step is 0 (Rounds)
    const roundsObs: Observable<RoundModel[]> = (this.assessmentRounds.length > 0 && this.activeStep !== 0)
      ? of(this.assessmentRounds)
      : this.assessmentScheduleService.GetAssessmentRound(this.assessmentId).pipe(
          catchError(() => of([]))
        );

    forkJoin({
      status: statusObs,
      rounds: roundsObs,
    }).subscribe({
      next: ({ status, rounds }) => {
        this.stepsStatus = status;
        this.assessmentRounds = rounds || [];
        this.stepsLoaded = true;
        this.updateCompletedStepsFromStatus();

        if (shouldUpdateActiveStep) {
          this.setActiveStepFromStatus();
        }
        this.isStepUpdating = false;
        this.updateStepMenuItems();
      },
      error: () => {
        this.stepsLoaded = true;
        this.isStepUpdating = false;
        this.updateStepMenuItems();
      }
    });
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
    if (!this.stepsStatus) return;

    const currentKeys = this.filteredStepKeys;

    // Find the step with 'Active' status
    for (const key of currentKeys) {
      if (this.stepsStatus[key] === 'Active') {
        this.activeStep = this.stepKeys.indexOf(key);
        if (!this.visitedSteps.includes(this.activeStep)) {
          this.visitedSteps.push(this.activeStep);
        }
        return;
      }
    }

    // If no active step found, find the first pending step
    for (const key of currentKeys) {
      if (this.stepsStatus[key] === 'Pending') {
        this.activeStep = this.stepKeys.indexOf(key);
        if (!this.visitedSteps.includes(this.activeStep)) {
          this.visitedSteps.push(this.activeStep);
        }
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

    if (this.activeStep < 0 && currentKeys.length > 0) {
      this.activeStep = this.stepKeys.indexOf(currentKeys[0]);
    }

    if (this.activeStep >= 0 && !this.visitedSteps.includes(this.activeStep)) {
      this.visitedSteps.push(this.activeStep);
    }
  }


  public moveToNextStep(): void {
    this.loadStepsStatus(true);
  }

  public isStepEnabled(stepIndex: number): boolean {
    if (!this.stepsLoaded || !this.stepsStatus) return false;

    // If step is currently updating status/validating, disable navigation
    if (this.isStepUpdating) {
      return false;
    }

    // If question set is incomplete, block all steps after index 1
    if (this.isQuestionSetIncomplete && stepIndex > 1) {
      return false;
    }

    // Block if child component has dirty/unsaved changes
    if (this.questionSetStepComponent?.isDirty && stepIndex > 1) {
      return false;
    }

    // Block if we have modified question sets and haven't clicked Complete yet
    if (this.hasModifiedQuestionSetAfterComplete && stepIndex > 1) {
      return false;
    }

    // If coordinator assignment is incomplete, block all steps after index 2
    if (this.isCoordinatorIncomplete && stepIndex > 2) {
      return false;
    }

    // If front desk assignment is incomplete, block all steps after index 3
    if (this.isFrontDeskIncomplete && stepIndex > 3) {
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
    if (this.assessment && !this.assessment.isActive) {
      return true;
    }
    return this.stepsLoaded && this.stepsStatus?.schedule === 'Completed';
  }

  public get isCandidateSchedulingReadOnly(): boolean {
    if (this.assessment && !this.assessment.isActive) {
      return true;
    }
    const areAllRoundsFinished =
      this.assessmentRounds.length > 0 &&
      this.assessmentRounds.every(
        (r) => r.status?.toLowerCase() === 'completed',
      );

    return this.isSchedulingConfigReadOnly && areAllRoundsFinished;
  }

  public getProgressPercentage(): number {
    if (!this.stepsLoaded || !this.stepsStatus) return 0;
    if (this.isStepUpdating) {
      return this.lastProgressPercentage;
    }
    const currentKeys = this.filteredStepKeys;
    const totalSteps = currentKeys.length;
    if (totalSteps === 0) return 0;

    const completedSteps = currentKeys.filter(
      (key) => this.stepsStatus[key] === 'Completed',
    ).length;
    this.lastProgressPercentage = Math.round((completedSteps / totalSteps) * 100);
    return this.lastProgressPercentage;
  }

  public goToRecruitmentDetail(): void {
    if (this.assessmentId) {
      this.router.navigate([`/admin/recruitments/${this.assessmentId}`]);
    } else {
      this.router.navigate(['/admin/recruitments']);
    }
  }

  @HostListener('document:mouseover', ['$event'])
  public onMouseOver(event: MouseEvent): void {
    if (!this.assessment || this.assessment.isActive) {
      this.showHoverTooltip = false;
      return;
    }

    const target = event.target as HTMLElement;
    if (!target) return;

    const disabledElement = target.closest('button[disabled], input[disabled], select[disabled], textarea[disabled], .p-disabled, .disabled, [disabled], .p-button-disabled, .rounds-tab--disabled, .p-popover button[disabled]') as HTMLElement;

    if (disabledElement) {
      this.currentHoveredElement = disabledElement;
      const rect = disabledElement.getBoundingClientRect();
      
      const tooltipWidth = 320; 
      const tooltipHeight = 40;
      const padding = 12;

      let left = rect.left + rect.width / 2;
      let top = rect.top - 8;
      let positionBelow = false;

      if (left - tooltipWidth / 2 < padding) {
        left = tooltipWidth / 2 + padding;
      } else if (left + tooltipWidth / 2 > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth / 2 - padding;
      }

      if (top - tooltipHeight < padding) {
        top = rect.bottom + 8;
        positionBelow = true;
      }

      this.tooltipX = left;
      this.tooltipY = top;
      this.tooltipPositionBelow = positionBelow;
      this.showHoverTooltip = true;
    } else {
      this.showHoverTooltip = false;
    }
  }

  @HostListener('document:mouseout', ['$event'])
  public onMouseOut(event: MouseEvent): void {
    if (this.showHoverTooltip && this.currentHoveredElement) {
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !this.currentHoveredElement.contains(relatedTarget)) {
        this.showHoverTooltip = false;
        this.currentHoveredElement = null;
      }
    }
  }
}
