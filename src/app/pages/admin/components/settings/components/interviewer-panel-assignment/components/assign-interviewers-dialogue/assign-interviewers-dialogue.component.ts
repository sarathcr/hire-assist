/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  interviewer,
  interviewerModal,
} from '../../../../../../models/interviewers-model';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InterviewService } from '../../../../../../services/interview.service';
@Component({
  selector: 'app-assign-interviewers-dialogue',
  imports: [
    InputMultiselectComponent,
    ButtonComponent,
    ReactiveFormsModule,
    InputSelectComponent,
    ToastModule,
  ],
  templateUrl: './assign-interviewers-dialogue.component.html',
  styleUrl: './assign-interviewers-dialogue.component.scss',
})
export class AssignInterviewersDialogueComponent implements OnInit {
  // Public Properties
  public data!: interviewer;
  public optionsMap!: OptionsMap;
  public interviewers!: Option[];
  public panels!: Option[];
  public interviewersData: any;
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public interviewerSchedule = new interviewerModal();
  public isEdit = false;
  public assessmentId?: number;
  public interviewId?: number;
  constructor(
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly storeService: StoreService,
    public dialog: DialogService,
    private readonly messageService: MessageService,
    private readonly interviewService: InterviewService,
  ) {
    this.fGroup = buildFormGroup(this.interviewerSchedule);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.data = this.config.data;
    this.isEdit = !!this.data.formData?.id;
    // Handle both camelCase and lowercase property names
    this.assessmentId =
      this.data.assessmentId || (this.data as any).assessmentid;
    this.interviewId = this.data.interviewId;
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    const users = this.optionsMap['interviewers'] as unknown as Option[];
    this.interviewers = users?.filter((user) =>
      user.roles?.includes('Interviewer'),
    );
    this.panels = this.optionsMap['panels'] as unknown as Option[];
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();

    if (this.isEdit) {
      const panelId =
        this.data.formData.panelId || this.data.formData.panelName;
      const interviewers = this.data.formData.interviewers;
      this.fGroup.patchValue({
        interviewers: interviewers || [],
        panels: panelId ?? null,
      });
    } else {
      this.fGroup.patchValue({
        interviewers: [],
        panels: null,
      });
    }
  }

  public getPanelNames(): string {
    const panelValue = this.fGroup.get('panels')?.value;
    if (!panelValue) return '';
    const panelIds = (
      Array.isArray(panelValue) ? panelValue : [panelValue]
    ).map(String);

    const panelNames = this.panels
      .filter((p) => panelIds.includes(String(p.value)))
      .map((p) => p.label);
    const data = panelNames.join(', ');
    return data;
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();

    if (!this.fGroup.valid) {
      return;
    }

    // Debug: Log the values to see what we're working with
    console.log(
      'onSubmit - assessmentId:',
      this.assessmentId,
      'interviewId:',
      this.interviewId,
      'isEdit:',
      this.isEdit,
    );
    console.log('onSubmit - config.data:', this.config.data);

    // If assessmentId and interviewId are present, make API call for scheduling recruitment
    // Check for !== undefined and !== null to allow 0 values
    if (
      this.assessmentId !== undefined &&
      this.assessmentId !== null &&
      this.interviewId !== undefined &&
      this.interviewId !== null
    ) {
      console.log('Making API call with:', {
        assessmentId: this.assessmentId,
        interviewId: this.interviewId,
      });
      const formValue = this.fGroup.value;
      const panelId = formValue.panels ? Number(formValue.panels) : null;
      const interviewers = Array.isArray(formValue.interviewers)
        ? formValue.interviewers
        : formValue.interviewers
          ? [formValue.interviewers]
          : [];

      console.log(
        'Form values - panelId:',
        panelId,
        'interviewers:',
        interviewers,
      );

      if (!panelId || interviewers.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Please select a panel and at least one interviewer.',
        });
        return;
      }

      const payload = {
        panelId: panelId,
        interviewers: interviewers,
        interviewId: this.interviewId,
        assessmentId: this.assessmentId,
      };

      console.log('API Payload:', payload);

      this.interviewService.createInterviewPanel(payload).subscribe({
        next: (response) => {
          console.log('API Success Response:', response);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Interview panel assigned successfully',
          });
          this.ref.close({ ...this.fGroup.value, submitted: true });
        },
        error: (error: CustomErrorResponse) => {
          console.error('API Error:', error);
          const errorMessage =
            error?.error?.errorValue ||
            error?.error?.message ||
            'Failed to assign interview panel';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
          });
        },
      });
      return;
    } else {
      console.log('Skipping API call - assessmentId or interviewId missing');
    }

    // Default behavior for other contexts
    if (this.isEdit && this.ref) {
      const id = this.data?.formData?.id;
      this.ref.close({ ...this.fGroup.value, id });
    } else {
      this.ref.close(this.fGroup.value);
    }
  }

  public onClose() {
    this.ref.close();
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new interviewerModal();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['interviewers'] as CustomSelectConfig).options = this
      .optionsMap['interviewers'] as unknown as Option[];

    (this.configMap['panels'] as CustomSelectConfig).options = this.optionsMap[
      'panels'
    ] as unknown as Option[];
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.interviewers = this.optionsMap['interviewers'] as unknown as Option[];
  }
}
