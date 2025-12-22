/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, input, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  frontDesk,
  FrontDeskFormGroup,
  frontDeskModal,
  frontDeskResponse,
} from '../../../../../../models/frontDesk-model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { CollectionInterface } from '../../assessment-view.component';
import { FrontdeskSkeletonComponent } from './front-desk-skeleton.component';
import { StepsStatusService } from '../../../../services/steps-status.service';

@Component({
  selector: 'app-front-desk',
  imports: [
    CommonModule,
    InputMultiselectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FrontdeskSkeletonComponent,
    ToastModule,
  ],
  templateUrl: './front-desk.component.html',
  styleUrl: './front-desk.component.scss',
})
export class FrontDeskComponent implements OnInit {
  public data!: frontDesk;
  public optionsMap!: OptionsMap;
  public users!: Option[];
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public assessmentSchedule = new frontDeskModal();
  public selectedUsers: FrontDeskFormGroup[] = [];
  public frontDesk!: FrontDeskFormGroup[];

  public assessmentId = input<number>();

  constructor(
    private storeService: StoreService,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
    private ngZone: NgZone,
    private stepsStatusService: StepsStatusService,
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
    this.frontDesk = [];
  }
  ngOnInit(): void {
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();
    this.GetFrontDeskUsers();
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const formData = this.fGroup.value;
    if (formData?.users?.length) {
      this.frontDesk = this.users
        .filter((item) => formData.users.includes(item.value))
        .map((item) => ({
          id: parseInt(item.value, 10),
          userId: item.value,
          assessmentId: Number(this.assessmentId()),
          name: item.label,
        }));
      const payload = this.frontDesk.map((item) => ({
        UserId: item.userId,
        AssessmentId: item.assessmentId,
      }));

      this.assessmentService.addFrontDeskUser(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Assigned Frontdesk Users',
          });
          this.GetFrontDeskUsers();
          // Call step status API and move to next step
          this.checkStepStatusAndMoveNext();
        },
        error: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Frontdesk Users are not selected',
          });
        },
      });
    }
  }

  private GetFrontDeskUsers(): void {
    this.assessmentService
      .getFrontDeskUserByAssessment(Number(this.assessmentId()))
      .subscribe({
        next: (response: frontDeskResponse[]) => {
          this.frontDesk = response.map((item: frontDeskResponse, index: number) => ({
            id: item.id ?? index + 1,
            name: item.name ?? '',
            userId: item.userId ?? '',
            assessmentId: item.assessmentId ?? 0,
          }));
          this.setInitialFormValue();
        },
        error: () => {
          this.frontDesk = [];
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Frontdesk Users',
          });
        },
      });
  }

  private setConfigMaps(): void {
    const { metadata } = new frontDeskModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    if (this.configMap['users']) {
      (this.configMap['users'] as CustomSelectConfig).options =
        (this.users as unknown as Option[]) || [];
    }
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    
    const frontDeskCoordinators =
      (this.optionsMap?.['frontdesks'] as unknown as Option[]) || [];

    if (frontDeskCoordinators.length > 0) {
      this.users = frontDeskCoordinators.map((item: Option) => ({
        label: item.label,
        value: item.value,
      }));
    } else {
      const allUsers = (this.optionsMap['users'] as unknown as Option[]) || [];
      this.users = allUsers
        .filter((user) => user.roles?.includes('FrontDesk') || user.roles?.includes('frontDesk'))
        .map((item: Option) => ({
          label: item.label,
          value: item.value,
        }));
    }
    
    if (!this.users) {
      this.users = [];
    }
  }

  private setInitialFormValue(): void {
    const selectedUserIds = this.frontDesk.map((u) => u.userId);
    this.fGroup.patchValue({ users: selectedUserIds });
  }

  private checkStepStatusAndMoveNext(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          // Notify parent to move to next step
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
        error: () => {
          // Even if step status API fails, try to move to next step
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
      });
    }
  }
}
