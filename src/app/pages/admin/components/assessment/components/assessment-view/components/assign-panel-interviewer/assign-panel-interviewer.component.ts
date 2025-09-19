import { Component, input, OnInit } from '@angular/core';
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
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../../../shared/models/option';
import { PaginatedData } from '../../../../../../../../shared/models/pagination.models';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { ConfigMap } from '../../../../../../../../shared/utilities/form.utility';
import { CoordinatorPanelBridgeService } from '../../../../../../../coordinator/services/coordinator-panel-bridge.service';
import {
  CordinatorData,
  CreatePanel,
  paneldata,
  PanelInterviewerdData,
  PanelSummary,
} from '../../../../../../models/assessment-schedule.model';
import { AssignPanelInterviewerSkeletonComponent } from './assign-panel-interviewer.skeleton';

interface PanelFormGroup {
  panel: FormControl<string[] | null>;
  interviewers: FormControl<string[] | null>;
}

interface PanelInterviewerData {
  panel: Option[];
  interviewers: [];
}

export const uniqueRoundValidator: ValidatorFn = (
  formArray: AbstractControl,
): ValidationErrors | null => {
  const selectedPanels = (formArray as FormArray).controls
    .map((control) => control.get('panel')?.value)
    .filter((panel) => Array.isArray(panel) && panel.length > 0)
    .map((panel) => panel[0]);

  const duplicates = selectedPanels.filter(
    (panel, index, self) => self.indexOf(panel) !== index,
  );

  return duplicates.length > 0 ? { duplicateRounds: true } : null;
};

@Component({
  selector: 'app-assign-panel-interviewer',
  imports: [
    ReactiveFormsModule,
    InputMultiselectComponent,
    ButtonComponent,
    ToastModule,
    InputTextareaComponent,
    InputTextComponent,
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
  public panelOptions!: Option[];
  public data = false;

  public assessmentId = input<number>();

  private ref: DynamicDialogRef | undefined;

  get panelDetailsFormArray(): FormArray<FormGroup<PanelFormGroup>> {
    return (
      (this.fGroup?.get('paneldetails') as FormArray<
        FormGroup<PanelFormGroup>
      >) ?? this.fb.array([])
    );
  }
  get createPanelForm(): FormGroup {
    return this.fGroup.get('createPanel') as FormGroup;
  }

  constructor(
    private readonly fb: FormBuilder,
    public messageService: MessageService,
    private storeService: StoreService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    public dialog: DialogService,
  ) {}

  ngOnInit(): void {
    this.fGroup = this.fb.group({
      paneldetails: this.fb.array([], [uniqueRoundValidator]),
      createPanel: this.fb.group({
        panelName: [''],
        description: [''],
      }),
    });
    this.loadData();
  }
  private loadData(): void {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    const users = this.optionsMap['users'] as unknown as Option[];
    this.interviewerOptions = users
      .filter((user) => user.roles?.includes('Interviewer'))
      .map(({ label, value }) => ({ label, value }));

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

          this.setConfigMaps();
          this.initializeForm();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error in getting Panel Details.',
          });
        },
      });
  }

  public onSubmit() {
    const rawData: PanelInterviewerdData[] =
      this.fGroup.getRawValue().paneldetails;

    const apiPayload =
      rawData.map((detail) => ({
        panelId: Number(detail.panel[0]),
        interviewers: Array.isArray(detail.interviewers)
          ? detail.interviewers
          : [detail.interviewers],
      })) || [];

    this.coordinatorPanelBridgeService
      .addInterviewerPanels(apiPayload)
      .subscribe({
        next: () => {
          this.getPaginatedPanelData();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated interviewers into panels',
          });
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

  private setConfigMaps(): void {
    this.configMap = {
      panel: {
        id: 'panel',
        labelKey: 'Panels',
        options: this.panelOptions,
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
  public onSave(): void {
    const rawData = this.fGroup.getRawValue().createPanel;
    const payload: CreatePanel = {
      name: rawData.panelName,
      isActive: true,
      isAssigned: false,
      description: rawData.description,
    };
    this.coordinatorPanelBridgeService.createPanel(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Panel created successfully',
        });
        this.getPaginatedPanelData();
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

  private initializeForm(): void {
    this.panelDetailsFormArray.clear();
    this.assessmentPanel.forEach((panel) => {
      const interviewerIds = panel.interviewers?.map((i) => i.id) || [];
      this.panelDetailsFormArray.push(
        this.createRoundFormGroup([String(panel.id)], interviewerIds),
      );
    });
  }

  private createRoundFormGroup(
    roundIds: string[] | null = null,
    coordinatorIds: string[] | null = null,
  ): FormGroup<PanelFormGroup> {
    return this.fb.group({
      interviewers: new FormControl<string[] | null>(coordinatorIds),

      panel: new FormControl<string[] | null>(roundIds),
    });
  }
}
