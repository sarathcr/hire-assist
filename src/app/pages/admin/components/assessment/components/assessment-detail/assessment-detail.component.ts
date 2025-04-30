import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { StepperSkeletonComponent } from '../../../../../../shared/components/stepper/stepper-skeleton';
import { StepperComponent } from '../../../../../../shared/components/stepper/stepper.component';
import { recruitment } from '../../../../../../shared/models/stepper.models';
import {
  Assessment,
  AssessmentRound,
} from '../../../../models/assessment.model';
import { AssessmentService } from '../../../../services/assessment.service';
import { StepperService } from '../../services/stepper.service';
import { StepperViewComponent } from './components/stepper-view/stepper-view.component';
import { InnerSidebarComponent } from "../../../../../../shared/components/inner-sidebar/inner-sidebar.component";
import { InnerSideBarSkeletonComponent } from "../../../../../../shared/components/inner-sidebar/inner-sidebar-skeleton";

@Component({
  selector: 'app-assessment-detail',
  imports: [SkeletonModule, StepperComponent, StepperSkeletonComponent, InnerSidebarComponent, InnerSideBarSkeletonComponent],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss',
})
export class AssessmentDetailComponent implements OnInit {
  public assessmentId!: number;
  public sidebarConfig!: MenuItem[];
  public data!: Assessment;
  public step!: AssessmentRound[];
  public stepperConfig!: recruitment[];
  public currentStep!: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private stepperService: StepperService,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
  ) { }

  // LifeCycle Hooks
  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    if (routeId) {
      this.assessmentId = Number(routeId);
      this.getAssessmentDetails(this.assessmentId);
      this.getAssessmentRoundDetails(this.assessmentId);
    }
    // this.getCurrentRouteId();
    this.setSidebarConfig();
  }

  // Public Methods

  public onStepperChange(currentstep: number) {

    const currentRound = this.stepperConfig.find(
      (step) => step.value === currentstep,
    );
    if (currentRound) {
      const roundId = currentRound.id;
      this.stepperService.setCurrentRound(roundId);
    } else {
    }
  }

  // Private Methods

  private setSidebarConfig(): void {
    this.sidebarConfig = [
      {
        items: [
          {
            label: 'Summary',
            icon: 'pi pi-palette',
            index: 0,
            routerLinkActiveOptions: { exact: true },

            command: () => {
              // const stepData = this.stepperConfig.find(
              //   (item) => item.id === this.currentStep,
              // );
              // if (stepData) {
              this.stepperService.setFilterType(0);
            },
            // },
          },
          {
            label: 'Selected',
            icon: 'pi pi-link',
            index: 1,
            command: () => {
              this.stepperService.setFilterType(1);
              //}
            },
          },
          {
            label: 'Rejected',
            icon: 'pi pi-home',
            index: 2,
            command: () => {
              this.stepperService.setFilterType(2);
            },
          },
        ],
      },
    ];
  }


  private getAssessmentDetails(id: number): void {
    const next = (res: Assessment) => {
      this.data = res;
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.assessmentService.getEntityById(id).subscribe({ next, error });
  }

  private getAssessmentRoundDetails(id: number): void {
    const next = (res: AssessmentRound[]) => {
      this.step = res;

      this.stepperConfig = this.step
        // .filter((round) => round.IsActive) // Optional: Filter only active rounds
        .sort((a, b) => a.sequence - b.sequence)
        .map((round) => ({
          id: round.id, // Use the `id` property as the ID
          header: round.round, // Use the `round` property as the header
          value: round.sequence, // Use the `sequence` property as the value
          completed: false,
          assessmentid: this.assessmentId,
          component: StepperViewComponent, // Default to false
          // Dynamically map components
        }));
      this.stepperService.setAssessmentRoundList(this.stepperConfig);

    };
    const error = (error: string) => {
    };
    this.assessmentService
      .getAssessmentRoundByAssessmnetId(id).subscribe({ next, error });
  }
}
