/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../button/button.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextCalenderComponent } from '../../form/input-text-calender/input-text-calender.component';
import { Toast } from 'primeng/toast';
import { buildFormGroup, ConfigMap } from '../../../utilities/form.utility';
import { Profile } from '../../../models/profile.models';
import { MessageService } from 'primeng/api';
import { InputTextIftalabelComponent } from '../../form/input-text-iftalabel/input-text-iftalabel.component';
import { StoreService } from '../../../services/store.service';
import { UserState } from '../../../models/user.models';
import { RolesEnum } from '../../../enums/enum';
import { BaseComponent } from '../../base/base.component';
import { ActivatedRoute } from '@angular/router';
import { StepperComponent } from '../../stepper/stepper.component';
import { AssessmentRound } from '../../../../pages/admin/models/assessment.model';
import { recruitment } from '../../../models/stepper.models';
import { AssessmentService } from '../../../../pages/admin/services/assessment.service';
import { Candidate } from '../../../../pages/admin/models/stepper.model';
import { InterviewService } from '../../../../pages/admin/services/interview.service';
import { StepperSkeletonComponent } from '../../stepper/stepper-skeleton';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    InputTextIftalabelComponent,
    Toast,
    StepperComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent extends BaseComponent implements OnInit {
  public profileImage = 'default_profile.jpg';
  public imageAlt = 'image';
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public profile = new Profile();
  public userData!: UserState;
  public roleNames: string[] = [];
  public userId!: string | null;
  public assessmentId!: string | null;
  public step!: AssessmentRound[] | null;
  public stepperConfig!: recruitment[];
  public CandidateFLow!: Candidate | null;

  constructor(private messageService: MessageService,
    private storeService: StoreService,
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private interviewService: InterviewService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.profile);

  }

  ngOnInit(): void {
    this.setConfigMaps();

    this.route.paramMap.subscribe(params => {
      this.userId = params.get('userid'),
        this.assessmentId = params.get('assessmentId');
    });
    if (this.userId && this.assessmentId) {
      console.log('userId', this.userId, 'assessmentId', this.assessmentId)
      this.getAssessmentRoundDetails(this.assessmentId)
      this.getAssessmentFlowDetails(this.userId, Number(this.assessmentId))



    }
    else {
      console.log("...")
      const user = this.storeService.state$.subscribe((value) => {
        this.userData = value.userState;
        const roleValue = this.userData.role; // Assuming role is a number or an array of numbers
        const roles = Array.isArray(this.userData.role) ? this.userData.role : [this.userData.role];

        if (this.userData?.role) {
          this.roleNames = roles
            .map((roleValue) => RolesEnum[roleValue])            // Returns string | undefined
            .filter((roleName): roleName is string => !!roleName) // Type guard
            .map((roleName) => roleName.toLowerCase());          // Now it's safely typed
        }
        if (this.roleNames.length > 0 && this.roleNames.includes('admin')) {
          this.roleNames = ['admin'];
        }

        if (this.userData) {
          this.fGroup.patchValue({
            name: this.userData.name || '',     // assuming keys match your control names
            email: this.userData.id || '',
            role: this.roleNames || ''
          });
        }

      });


      this.subscriptionList.push(user);
    }
  }

  public onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // public async onSave() {
  //   this.fGroup.markAllAsTouched();
  //   const isFormValid = this.fGroup.valid;
  //   if (isFormValid) {
  //     // Show success message
  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Success',
  //       detail: 'Profile saved successfully',
  //     });
  //   } else {
  //     // Optional: Show an error message
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: 'Please complete the required fields',
  //     });
  //   }
  // }

  private setConfigMaps(): void {
    const { metadata } = new Profile();
    this.configMap = metadata.configMap || {};
  }

  private getAssessmentRoundDetails(id: string): void {
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
          statusId: round.statusId,
          assessmentid: Number(this.assessmentId),
        }));

    };
    const error = (error: string) => {
    };
    this.assessmentService
      .getAssessmentRoundByAssessmnetId(Number(id)).subscribe({ next, error });
  }


  private getAssessmentFlowDetails(candidateId: string, assessmentId: number): void {
    console.log('candidateId', candidateId, 'assessmentId', assessmentId)
    const next = (res: Candidate) => {
      this.CandidateFLow = res;


      if (this.CandidateFLow) {
        this.fGroup.patchValue({
          name: this.CandidateFLow.candidateName || '',     // assuming keys match your control names
          email: this.CandidateFLow.email || '',
          role: this.CandidateFLow.roles || ''
        });


        if (this.CandidateFLow.assessmentFlow) {
          console.log("...", this.stepperConfig)
          this.stepperConfig = this.stepperConfig.map((step) => {
            const matchingRound = this.CandidateFLow?.assessmentFlow.find(
              (round) => round.assessmentRoundId === step.id
            );
            console.log('matchingRound', matchingRound, 'step.id', step.id) // Debugging
            if (matchingRound) {
              console.log("...!", this.getStepColor(matchingRound.statusId))
              return {
                ...step,
                statusId: matchingRound.statusId,
                color: this.getStepColor(matchingRound.statusId), // Use helper method to determine color
              };
            }
            return step;
          });

          console.log('Updated stepperConfig:', this.stepperConfig); // Debugging
        }

      }

    };
    const error = (error: string) => {
    };
    this.interviewService
      .getAssessmentFlow(candidateId, assessmentId).subscribe({ next, error });
  }


  private getStepColor(status: number): string {
    console.log('Status:', status); // Debugging
    switch (status) {
      case 7:
        return 'green';
      case 2:
        return 'orange';
      case 9:
        return 'red';
      default:
        return 'orange'; // Default color for unknown statuses
    }

  }
}

// Compare this snippet from src/app/shared/components/pages/profile/profile.component.html:
