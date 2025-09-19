/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, input, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-front-desk',
  imports: [
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
  ) {
    this.fGroup = buildFormGroup(this.assessmentSchedule);
  }
  // LifeCycle Hooks
  ngOnInit(): void {
    this.GetFrontDeskUsers();
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    const formData = this.fGroup.value;
    if (formData?.users?.length) {
      const collections =
        this.storeService.getCollection() as unknown as CollectionInterface;
      const users: Option[] = collections.users;
      this.frontDesk = users
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

  //private methods
  private GetFrontDeskUsers(): void {
    this.assessmentService
      .getFrontDeskUserByAssessment(Number(this.assessmentId()))
      .subscribe({
        next: (response: frontDeskResponse[]) => {
          this.frontDesk = response.map((item: frontDeskResponse) => ({
            id: item.id ?? 0,
            name: item.name ?? '',
            userId: item.userId ?? '',
            assessmentId: item.assessmentId ?? 0,
          }));
          this.setInitialFormValue();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Frontdesk Users',
          });
        },
      });
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new frontDeskModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['users'] as CustomSelectConfig).options = this.optionsMap[
      'users'
    ] as unknown as Option[];
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.users = this.optionsMap['users'] as unknown as Option[];
  }

  private setInitialFormValue(): void {
    const selectedUserIds = this.frontDesk.map((u) => u.userId);
    this.fGroup.patchValue({ users: selectedUserIds });
  }
}
