import { Component, input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../../../shared/models/option';
import { PaginatedData } from '../../../../../../../../shared/models/pagination.models';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { CoordinatorPanelBridgeService } from '../../../../../../../coordinator/services/coordinator-panel-bridge.service';
import {
  CordinatorData,
  CreatePanel,
  paneldata,
  PanelInterviewerdData,
  PanelSummary,
} from '../../../../../../models/assessment-schedule.model';
import { AssignPanelInterviewerSkeletonComponent } from './assign-panel-interviewer.skeleton';
import { CreatePanelDialogComponent } from './create-panel-dialog.component';
import { InterviewService } from '../../../../services/interview.service';
import { StepsStatusService } from '../../../../services/steps-status.service';

interface PanelFormGroup {
  panel: FormControl<string | null>;
  interviewers: FormControl<string[] | null>;
}

interface PanelInterviewerData {
  panel: string | null;
  interviewers: string[];
}

export const uniquePanelValidator: ValidatorFn = (
  formArray: AbstractControl,
): ValidationErrors | null => {
  const selectedPanels = (formArray as FormArray).controls
    .map((control) => control.get('panel')?.value)
    .filter((panel) => panel != null && panel !== '');

  const duplicates = selectedPanels.filter(
    (panel, index, self) => self.indexOf(panel) !== index,
  );

  if (duplicates.length > 0) {
    // Set error on each duplicate control
    const duplicateSet = new Set(duplicates);
    (formArray as FormArray).controls.forEach((control) => {
      const panelValue = control.get('panel')?.value;
      if (panelValue && duplicateSet.has(panelValue)) {
        control.get('panel')?.setErrors({ duplicatePanel: true });
      } else {
        const panelControl = control.get('panel');
        if (panelControl?.hasError('duplicatePanel')) {
          const errors = { ...panelControl.errors };
          delete errors['duplicatePanel'];
          panelControl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    });
    return { duplicatePanels: true };
  }

  // Clear duplicate errors if no duplicates
  (formArray as FormArray).controls.forEach((control) => {
    const panelControl = control.get('panel');
    if (panelControl?.hasError('duplicatePanel')) {
      const errors = { ...panelControl.errors };
      delete errors['duplicatePanel'];
      panelControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  });

  return null;
};

@Component({
  selector: 'app-assign-panel-interviewer',
  imports: [
    ReactiveFormsModule,
    InputMultiselectComponent,
    InputSelectComponent,
    ButtonComponent,
    ToastModule,
    AssignPanelInterviewerSkeletonComponent,
  ],
  templateUrl: './assign-panel-interviewer.component.html',
  styleUrl: './assign-panel-interviewer.component.scss',
})
export class AssignPanelInterviewerComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;

  public isEdit = false;
  public coordinatorData!: CordinatorData;
  private optionsMap!: OptionsMap;
  public assessmentPanel!: PanelSummary[];
  public panel: paneldata[] = [];
  public PanelInterviewerData!: PanelInterviewerData;
  public interviewerOptions!: Option[];
  public panelOptions!: Option[] | undefined;
  public data = false;
  public isLoading = true;
  private isSubmitting = false;
  private hasCalledInterviewPanel = false;
  private hasCalledStepStatus = false;
  private hasFinalized = false;
  private interviewPanelSubscription: Subscription | null = null;

  public assessmentId = input<number>();

  private ref: DynamicDialogRef | undefined;

  get panelDetailsFormArray(): FormArray<FormGroup<PanelFormGroup>> {
    return (
      (this.fGroup?.get('paneldetails') as FormArray<
        FormGroup<PanelFormGroup>
      >) ?? this.fb.array([])
    );
  }

  constructor(
    private readonly fb: FormBuilder,
    public messageService: MessageService,
    private readonly storeService: StoreService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    public dialog: DialogService,
    private readonly interviewService: InterviewService,
    private readonly stepsStatusService: StepsStatusService,
  ) {}

  ngOnInit(): void {
    this.fGroup = this.fb.group({
      paneldetails: this.fb.array([], [uniquePanelValidator]),
    });
    this.loadData();
  }
  private loadData(): void {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    const interviewers =
      (this.optionsMap?.['interviewers'] as unknown as Option[]) || [];

    this.interviewerOptions = interviewers.map((item: Option) => ({
      label: item.label,
      value: item.value,
    }));

    this.getAllPanelSummary();
  }

  private getAllPanelSummary() {
    const payload = {
      multiSortedColumns: [],
      filterMap: {},
      pagination: {
        pageNumber: 1,
        pageSize: 10,
      },
    };

    this.coordinatorPanelBridgeService
      .paginationEntity<paneldata>('panel/summary', payload)
      .subscribe((response: PaginatedData<paneldata>) => {
        this.panel = Array.isArray(response.data) ? response.data : [];
        this.panelOptions = this.panel.map((panel) => ({
          label: panel.name,
          value: String(panel.id),
        }));
        this.setConfigMaps();
        this.getPaginatedPanelData();
      });
  }

  public getPaginatedPanelData() {
    this.isLoading = true;
    const payload = {
      multiSortedColumns: [],
      filterMap: {},
      pagination: {
        pageNumber: 1,
        pageSize: 10,
      },
    };

    this.coordinatorPanelBridgeService
      .paginationEntity<PanelSummary>('panel/activePanelSummary', payload)
      .subscribe({
        next: (res: PaginatedData<PanelSummary>) => {
          this.data = true;
          this.assessmentPanel = res.data;
          this.isLoading = false;

          this.setConfigMaps();
          this.initializeForm();
        },
        error: () => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Panel Details.',
          });
        },
      });
  }

  public onSubmit(event?: Event | number | null) {
    // Prevent default form submission and stop propagation
    if (event && event instanceof Event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.isSubmitting) {
      return;
    }

    const rawData: PanelInterviewerdData[] =
      this.fGroup.getRawValue().paneldetails;

    const apiPayload =
      rawData
        .filter((detail) => detail.panel != null && detail.panel !== '')
        .map((detail) => ({
          panelId: Number(detail.panel),
          interviewers: Array.isArray(detail.interviewers)
            ? detail.interviewers
            : [detail.interviewers],
        })) || [];

    if (apiPayload.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one panel and interviewer.',
      });
      return;
    }

    // Reset flags for new submission
    this.isSubmitting = true;
    this.hasCalledInterviewPanel = false;
    this.hasCalledStepStatus = false;
    this.hasFinalized = false;
    // Clean up any existing subscription
    if (this.interviewPanelSubscription) {
      this.interviewPanelSubscription.unsubscribe();
      this.interviewPanelSubscription = null;
    }

    // First, call PanelAssignments API
    this.coordinatorPanelBridgeService
      .addInterviewerPanels(apiPayload)
      .subscribe({
        next: () => {
          // After successful PanelAssignments, call InterviewPanel API for each panel
          this.callInterviewPanelAPIs(apiPayload);
        },
        error: (error: CustomErrorResponse) => {
          this.isSubmitting = false; // Reset on error
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode === 3105) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error.errorValue,
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update interviewers into panels',
            });
          }
        },
      });
  }

  private callInterviewPanelAPIs(
    apiPayload: { panelId: number; interviewers: string[] }[],
  ) {
    if (this.hasCalledInterviewPanel || this.hasFinalized) {
      if (!this.hasFinalized) {
        this.finalizeSubmission();
      }
      return;
    }

    const assessmentIdValue = this.assessmentId();

    if (!assessmentIdValue || assessmentIdValue === 0) {
      this.finalizeSubmission();
      return;
    }

    this.hasCalledInterviewPanel = true;

    const interviewPanelPayloadArray = apiPayload.map((payload) => {
      return {
        panelId: payload.panelId,
        interviewers: payload.interviewers,
        interviewId: null,
        assessmentId: assessmentIdValue,
      };
    });

    if (interviewPanelPayloadArray.length > 0) {
      if (this.interviewPanelSubscription) {
        this.finalizeSubmission();
        return;
      }

      this.interviewPanelSubscription = this.interviewService
        .createInterviewPanels(interviewPanelPayloadArray)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Interview panels assigned successfully',
            });
            this.interviewPanelSubscription = null;
            this.finalizeSubmission();
          },
          error: (error: CustomErrorResponse) => {
            const errorMessage =
              error?.error?.errorValue ||
              error?.error?.message ||
              error?.error?.type ||
              'Failed to assign interview panels';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
            });
            this.interviewPanelSubscription = null;
            this.finalizeSubmission();
          },
        });
    } else {
      this.finalizeSubmission();
    }
  }

  private finalizeSubmission() {
    if (this.hasFinalized) {
      return;
    }

    if (!this.isSubmitting) {
      return;
    }

    this.hasFinalized = true;

    this.getPaginatedPanelData();

    const assessmentIdValue = this.assessmentId();

    if (
      assessmentIdValue &&
      assessmentIdValue !== 0 &&
      !this.hasCalledStepStatus
    ) {
      this.hasCalledStepStatus = true;
      this.stepsStatusService.notifyStepStatusUpdate(assessmentIdValue);
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Updated interviewers into panels',
    });

    this.resetSubmissionFlags();
  }

  private resetSubmissionFlags() {
    this.isSubmitting = false;
    this.hasCalledInterviewPanel = false;
    this.hasCalledStepStatus = false;
    this.hasFinalized = false;
    // Clean up subscription
    if (this.interviewPanelSubscription) {
      this.interviewPanelSubscription.unsubscribe();
      this.interviewPanelSubscription = null;
    }
  }

  private setConfigMaps(): void {
    this.configMap = {
      panel: {
        id: 'panel',
        labelKey: 'Panels',
        options: this.panelOptions || [],
      },
      interviewers: {
        id: 'interviewers',
        labelKey: 'interviewer',
        options: this.interviewerOptions,
      },
      panelName: {
        id: 'panelName',
        labelKey: 'Panel Name',
      },
      description: {
        id: 'description',
        labelKey: 'Description',
      },
    };
  }

  public getFilteredPanelOptions(index: number): Option[] {
    if (!this.panelOptions) {
      return [];
    }

    // Get all selected panel values from other form groups
    const selectedPanels = new Set(
      this.panelDetailsFormArray.controls
        .map((control, idx) => {
          if (idx === index) {
            return null;
          }
          return control.get('panel')?.value;
        })
        .filter((panel): panel is string => panel != null && panel !== ''),
    );

    // Filter out already selected panels
    return this.panelOptions.filter((option) => {
      const isSelected = selectedPanels.has(option.value);
      return isSelected === false;
    });
  }

  public getPanelConfig(index: number): CustomSelectConfig {
    const baseConfig = this.configMap['panel'] as CustomSelectConfig;
    return {
      ...baseConfig,
      options: this.getFilteredPanelOptions(index),
    };
  }

  public addRound(): void {
    this.panelDetailsFormArray.push(this.createRoundFormGroup());
  }

  public removeRound(index: number): void {
    const formGroupAtIndex = this.panelDetailsFormArray.at(index) as FormGroup;
    const paneltodelete = Number(formGroupAtIndex.value.panel);
    this.panelDetailsFormArray.removeAt(index);
    if (paneltodelete) {
      const modalData: DialogData = {
        message: `Are you sure you want to delete the panel Assignment?`,
        isChoice: true,
        cancelButtonText: 'Cancel',
        acceptButtonText: 'Yes',
      };
      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        header: 'Warning',
        maximizable: false,
        width: '35vw',
        modal: true,
        focusOnShow: false,
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw',
        },
        templates: {
          footer: DialogFooterComponent,
        },
      });
      this.ref.onClose.subscribe((result) => {
        if (result) {
          this.coordinatorPanelBridgeService
            .deletePanelAssignments(paneltodelete)
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Panel deleted successfully',
                });
                this.getPaginatedPanelData();
              },
              error: (error: CustomErrorResponse) => {
                const businerssErrorCode = error.error.businessError;
                if (businerssErrorCode === 3105) {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error.errorValue,
                  });
                }
              },
            });
        }
      });
    }
  }
  public openCreatePanelDialog(): void {
    const createPanelForm = this.fb.group({
      panelName: ['', []],
      description: ['', []],
    });

    const dialogData = {
      fGroup: createPanelForm,
      configMap: {
        panelName: this.configMap['panelName'],
        description: this.configMap['description'],
      },
    };

    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(CreatePanelDialogComponent, {
      data: dialogData,
      header: 'Create Panel',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      styleClass: 'create-panel-dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((result) => {
      document.body.style.overflow = 'auto';
      if (result) {
        const payload: CreatePanel = {
          name: result.panelName,
          isActive: true,
          isAssigned: false,
          description: result.description,
        };
        this.coordinatorPanelBridgeService.createPanel(payload).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Panel created successfully',
            });
            this.getAllPanelSummary();
          },
          error: (error: CustomErrorResponse) => {
            const businerssErrorCode = error.error.businessError;
            if (businerssErrorCode === 3105) {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail:
                  'Panel already exists with the same name. Please try with a different name.',
              });
            }
          },
        });
      }
    });
  }

  private initializeForm(): void {
    this.panelDetailsFormArray.clear();
    this.assessmentPanel.forEach((panel) => {
      const interviewerIds = panel.interviewers?.map((i) => i.id) || [];
      this.panelDetailsFormArray.push(
        this.createRoundFormGroup(String(panel.id), interviewerIds),
      );
    });
  }

  private createRoundFormGroup(
    panelId: string | null = null,
    coordinatorIds: string[] | null = null,
  ): FormGroup<PanelFormGroup> {
    return this.fb.group({
      interviewers: new FormControl<string[] | null>(coordinatorIds),
      panel: new FormControl<string | null>(panelId),
    });
  }
}
