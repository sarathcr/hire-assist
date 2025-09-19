/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { AssessmentRound } from '../../../../pages/admin/models/assessment.model';
import { Candidate } from '../../../../pages/admin/models/stepper.model';
import { AssessmentService } from '../../../../pages/admin/services/assessment.service';
import { InterviewService } from '../../../../pages/admin/services/interview.service';
import { RolesEnum } from '../../../enums/enum';
import { Profile } from '../../../models/profile.models';
import { recruitment } from '../../../models/stepper.models';
import { UserState } from '../../../models/user.models';
import { StoreService } from '../../../services/store.service';
import { buildFormGroup, ConfigMap } from '../../../utilities/form.utility';
import { BaseComponent } from '../../base/base.component';
import { InputTextIftalabelComponent } from '../../form/input-text-iftalabel/input-text-iftalabel.component';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, InputTextIftalabelComponent, Toast],
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

  constructor(
    private readonly messageService: MessageService,
    private readonly storeService: StoreService,
    private readonly route: ActivatedRoute,
    private readonly assessmentService: AssessmentService,
    private readonly interviewService: InterviewService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.profile);
  }

  ngOnInit(): void {
    this.setConfigMaps();

    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userid');
      this.assessmentId = params.get('recruitmentId');
    });
    if (this.userId && this.assessmentId) {
      this.getAssessmentRoundDetails(this.assessmentId);
      this.getAssessmentFlowDetails(this.userId, Number(this.assessmentId));
    } else {
      const user = this.storeService.state$.subscribe((value) => {
        this.userData = value.userState;
        const roles = Array.isArray(this.userData.role)
          ? this.userData.role
          : [this.userData.role];

        if (this.userData?.role) {
          this.roleNames = roles
            .map((roleValue) => RolesEnum[roleValue]) // Returns string | undefined
            .filter((roleName): roleName is string => !!roleName) // Type guard
            .map((roleName) => roleName.toLowerCase()); // Now it's safely typed
        }
        if (this.roleNames.length > 0 && this.roleNames.includes('admin')) {
          this.roleNames = ['admin'];
        }

        if (this.userData) {
          this.fGroup.patchValue({
            name: this.userData.name || '', // assuming keys match your control names
            email: this.userData.id || '',
            role: this.roleNames || '',
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

  private setConfigMaps(): void {
    const { metadata } = new Profile();
    this.configMap = metadata.configMap || {};
  }

  private getAssessmentRoundDetails(id: string): void {
    const next = (res: AssessmentRound[]) => {
      this.step = res;

      this.stepperConfig = this.step
        .sort((a, b) => a.sequence - b.sequence)
        .map((round) => ({
          id: round.id,
          header: round.round,
          value: round.sequence,
          completed: false,
          statusId: round.statusId,
          assessmentid: Number(this.assessmentId),
        }));
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.assessmentService
      .getAssessmentRoundByAssessmnetId(Number(id))
      .subscribe({ next, error });
  }

  private getAssessmentFlowDetails(
    candidateId: string,
    assessmentId: number,
  ): void {
    const next = (res: Candidate) => {
      this.CandidateFLow = res;

      if (this.CandidateFLow) {
        this.fGroup.patchValue({
          name: this.CandidateFLow.candidateName || '',
          email: this.CandidateFLow.email || '',
          role: this.CandidateFLow.roles || '',
        });

        if (this.CandidateFLow.assessmentFlow) {
          this.stepperConfig = this.stepperConfig.map((step) => {
            const matchingRound = this.CandidateFLow?.assessmentFlow.find(
              (round) => round.assessmentRoundId === step.id,
            );
            if (matchingRound) {
              return {
                ...step,
                statusId: matchingRound.statusId,
                color: this.getStepColor(matchingRound.statusId), // Use helper method to determine color
              };
            }
            return step;
          });
        }
      }
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.interviewService
      .getAssessmentFlow(candidateId, assessmentId)
      .subscribe({ next, error });
  }

  private getStepColor(status: number): string {
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
