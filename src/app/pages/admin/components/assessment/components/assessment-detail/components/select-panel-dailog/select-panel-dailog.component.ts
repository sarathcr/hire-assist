import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import {
  FilterMap,
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../../../shared/models/table.models';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { ConfigMap } from '../../../../../../../../shared/utilities/form.utility';
import {
  GetInterviewPanelsResponse,
  InterviewPanelsResponse,
  Interviewers,
  InterviewPanels,
} from '../../../../../../../coordinator/models/interview-panels.model';
import { CoordinatorPanelBridgeService } from '../../../../../../../coordinator/services/coordinator-panel-bridge.service';
import {
  InterviewSummary,
  PanelSummary,
  Interviewer,
} from '../../../../../../models/assessment-schedule.model';
import { interviewerInterface } from '../../../../../../models/interviewers-model';
import { AssignInterviewersDialogueComponent } from '../../../../../settings/components/interviewer-panel-assignment/components/assign-interviewers-dialogue/assign-interviewers-dialogue.component';
import { interviewerEditResponse } from '../../../../../settings/components/interviewer-panel-assignment/interviewer-panel-assignment.component';
import { InterviewService } from '../../../../services/interview.service';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Panel Name',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'panelDescription',
      displayName: 'Description',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'interviewerNames',
      displayName: 'Interviewers',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: false,
      hasChip: false,
    },

    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};

@Component({
  selector: 'app-select-panel-dailog',
  imports: [TableComponent, ButtonComponent],
  templateUrl: './select-panel-dailog.component.html',
  styleUrl: './select-panel-dailog.component.scss',
  providers: [TableDataSourceService],
})
export class SelectPanelDailogComponent implements OnInit {
  public panelData: PaginatedData<PanelSummary> = {
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
    data: [],
    succeeded: true,
    errors: [],
    message: '',
  };
  public panelColumn: TableColumnsData = tableColumns;
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;

  public filterMap!: FilterMap;
  public assessmentId!: number;
  public data!: PaginatedData<InterviewSummary>;
  public isCompleteDisabled = false;
  public selectedPanelIds: PanelSummary[] = [];
  public selectedPanel: string[] = [];
  public existingPanel: string[] = [];
  public intrviewid!: number;
  public IsMultiplePanel!: boolean;
  public isLoading = false;
  public isSubmitting = false;
  public selectedPanelForAssignment: PanelSummary | null = null;
  private currentInterviewers: string[] = [];
  private interviewersEdited = false;
  private editedPanelId: number | null = null;

  constructor(
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
    public dialog: DialogService,
    public messageService: MessageService,
    private readonly dataSourceService: TableDataSourceService<PanelSummary>,
    public config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
    public interviewservice: InterviewService,
  ) {}
  ngOnInit(): void {
    this.assessmentId = this.config.data.assessmentid;
    this.intrviewid = this.config.data.interviewId;
    this.getPaginatedPanelData();
    this.getInterviewPanel(this.intrviewid);
  }

  private getPaginatedPanelData() {
    const payload = {
      multiSortedColumns: [],
      filterMap: {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };

    this.isLoading = true;
    this.coordinatorPanelBridgeService
      .paginationEntity<PanelSummary>('panel/activePanelSummary', payload)
      .subscribe({
        next: (res: PaginatedData<PanelSummary>) => {
          const resData = res.data.map((item: PanelSummary) => {
            return {
              ...item,
              interviewerNames:
                item.interviewers?.map((i) => i.name).join(', ') ?? '',
              interviewers: item.interviewers ?? [],
            };
          });
          this.panelData = { ...res, data: resData };
          this.isLoading = false;
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

  public getInterviewPanel(InterviewId: number) {
    this.coordinatorPanelBridgeService
      .getinterviewPanles(InterviewId.toString())
      .subscribe({
        next: (res: GetInterviewPanelsResponse) => {
          this.selectedPanel = [String(res.panelId)];
          this.existingPanel = this.selectedPanel;
          // Store current interviewers from the existing assignment
          this.currentInterviewers =
            res.interviewer?.map((i: Interviewers) => i.id) ?? [];
        },
        error: () => {
          // If no panel is assigned, currentInterviewers will remain empty
          this.currentInterviewers = [];
        },
      });
  }

  public editPanel(panelData: InterviewPanels) {
    this.fGroup?.get('panels')?.setValidators(Validators.required);
    this.fGroup?.get('panels')?.updateValueAndValidity();

    const normalizedFormData: interviewerInterface = {
      id: panelData.id ? parseInt(panelData.id) : undefined,
      panelId: panelData.id ? parseInt(panelData.id) : undefined,
      interviewers:
        panelData.interviewers?.map((i: Interviewers) => i.id) ?? [],
      panelName: panelData.panelName,
    };

    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: normalizedFormData,
      isEdit: true,
      assessmentId: this.assessmentId,
      interviewId: this.intrviewid,
    };
    const dialogRef = this.dialog.open(AssignInterviewersDialogueComponent, {
      data: data,
      header: 'Update Panel',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    dialogRef.onClose.subscribe((formData: interviewerEditResponse) => {
      if (formData?.panels && formData?.interviewers?.length) {
        const payload = [
          {
            panelId: formData.panels,
            interviewers: formData.interviewers,
          },
        ];

        this.coordinatorPanelBridgeService
          .addInterviewerPanels(payload)

          .subscribe({
            next: () => {
              // Store which panel was edited
              this.editedPanelId = formData.panels;
              // Mark that interviewers have been edited for this panel
              this.interviewersEdited = true;
              // Update current interviewers if this is the selected panel
              if (
                this.selectedPanelIds.length > 0 &&
                String(this.selectedPanelIds[0].id) === String(formData.panels)
              ) {
                this.currentInterviewers = formData.interviewers;
              }
              // Refresh panel data to get updated interviewers
              this.getPaginatedPanelData();
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Updated interviewers into panels',
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'interviewers are not updated to Panels',
              });
            },
          });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'interviewers are not updated to Panels',
        });
      }
    });
  }
  public onPanelTablePayloadChange(payload: PaginatedPayload): void {
    this.isLoading = true;
    this.coordinatorPanelBridgeService
      .paginationEntity<PanelSummary>('panel/activePanelSummary', payload)
      .subscribe({
        next: (res: PaginatedData<PanelSummary>) => {
          const resData = res.data.map((item: PanelSummary) => {
            return {
              ...item,
              interviewerNames:
                item.interviewers?.map((i) => i.name).join(', ') ?? '',
              interviewers: item.interviewers ?? [],
            };
          });
          this.panelData = { ...res, data: resData };
          this.isLoading = false;
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
  public getSelectedPanelId(selectedIds: PanelSummary[]) {
    if (selectedIds.length > 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only one panel can be selected at a time.',
      });
      this.IsMultiplePanel = true;
      return;
    }
    this.IsMultiplePanel = false;
    const previousPanelId =
      this.selectedPanelIds.length > 0 ? this.selectedPanelIds[0].id : null;
    this.selectedPanelIds = selectedIds.map((item: PanelSummary) => item);
    
    // Reset interviewersEdited flag when a different panel is selected
    // This ensures we use current interviewers for newly selected unassigned panels
    if (
      previousPanelId &&
      selectedIds.length > 0 &&
      String(previousPanelId) !== String(selectedIds[0].id)
    ) {
      this.interviewersEdited = false;
      this.editedPanelId = null;
    }
  }
  public onSubmit() {
    if (!this.selectedPanelIds || this.selectedPanelIds.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a panel to assign.',
      });
      return;
    }

    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    const selectedPanel = this.selectedPanelIds[0];
    this.selectedPanelForAssignment = selectedPanel;
    const isAdd = this.existingPanel.length === 0;
    
    // Get the latest panel data from panelData to ensure we have the most up-to-date interviewers
    const latestPanelData = this.panelData.data.find(
      (p) => String(p.id) === String(selectedPanel.id),
    );
    const panelToUse = latestPanelData || selectedPanel;
    
    // Get interviewers from the panel
    let selectedInterviewerIds =
      panelToUse.interviewers?.map((i: Interviewer) => i.id) ?? [];
    
    // If interviewers were edited for this panel, use the stored currentInterviewers (which was updated during edit)
    // Otherwise, if the selected panel has no interviewers (unassigned panel) and interviewers haven't been edited,
    // use the current interviewers from the existing assignment
    if (
      this.interviewersEdited &&
      this.editedPanelId &&
      String(this.editedPanelId) === String(selectedPanel.id) &&
      this.currentInterviewers.length > 0
    ) {
      // Interviewers were edited for this panel, use the updated interviewers
      selectedInterviewerIds = [...this.currentInterviewers];
    } else if (
      selectedInterviewerIds.length === 0 &&
      !this.interviewersEdited &&
      this.currentInterviewers.length > 0
    ) {
      // Panel is unassigned and interviewers haven't been edited, use current interviewers
      selectedInterviewerIds = [...this.currentInterviewers];
    }

    const payload: InterviewPanels = {
      assessmentId: this.assessmentId,
      interviewId: Number(this.intrviewid),
      panelId: selectedPanel.id,
      interviewers: selectedInterviewerIds.map((id) => ({ id })),
    };

    this.isSubmitting = true;
    this.isLoading = true; // Show skeleton loader

    // First, call PanelAssignments API
    const panelAssignmentPayload = [
      {
        panelId: Number(selectedPanel.id),
        interviewers: selectedInterviewerIds,
      },
    ];

    this.coordinatorPanelBridgeService
      .addInterviewerPanels(panelAssignmentPayload)
      .subscribe({
        next: () => {
          // After successful PanelAssignments, check if panel already exists and then call InterviewPanel API
          this.coordinatorPanelBridgeService
            .getinterviewPanles(this.intrviewid.toString())
            .subscribe({
              next: (response: GetInterviewPanelsResponse) => {
                this.interview = response ?? {};
                const isInterviewIdSame =
                  payload.interviewId === this.interview.interviewId;
                const isPanelIdSame =
                  payload.panelId === this.interview.panelId;
                const isInterviewerSame =
                  JSON.stringify(payload.interviewers.sort()) ===
                  JSON.stringify(this.interview.interviewer.sort());

                const isAlreadyScheduled =
                  isInterviewIdSame && isPanelIdSame && isInterviewerSame;
                if (isAlreadyScheduled) {
                  this.isSubmitting = false;
                  this.isLoading = false;
                  this.messageService.add({
                    severity: 'info',
                    summary: 'Already Exists',
                    detail:
                      'This panel is already scheduled for the candidate.',
                  });
                  return;
                }
                if (isAdd) {
                  this.addInterviewPanels(payload);
                } else {
                  this.updateInterviewPanels(payload);
                }
              },
              error: (error: HttpErrorResponse) => {
                if (
                  error?.status === 422 &&
                  error?.error?.businessError === 3102
                ) {
                  // Panel doesn't exist, proceed with add
                  this.addInterviewPanels(payload);
                } else {
                  this.isSubmitting = false;
                  this.isLoading = false;
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to get interview panels.',
                  });
                }
              },
            });
        },
        error: (error: CustomErrorResponse) => {
          this.isSubmitting = false;
          this.isLoading = false;
          const errorMessage =
            error.error?.type ||
            error.error?.errorValue ||
            error.error?.message ||
            'Failed to update interviewers into panels';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
          });
        },
      });
  }

  private interview: GetInterviewPanelsResponse =
    {} as GetInterviewPanelsResponse;

  private addInterviewPanels(payload: InterviewPanels): void {
    this.interviewservice.addinterviewpanel(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview panel added successfully.',
        });
        // Close modal only on success
        this.ref.close({
          selectedpanel: this.selectedPanelIds,
          isAdd: true,
        });
      },
      error: (error: CustomErrorResponse) => {
        this.isSubmitting = false;
        this.isLoading = false;
        const errorMessage =
          error.error?.type ||
          error.error?.errorValue ||
          error.error?.message ||
          'Failed to add interview panel.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
        });
        // Keep modal open on error
      },
    });
  }

  private updateInterviewPanels(payload: InterviewPanels): void {
    if (!this.selectedPanelForAssignment) {
      this.isSubmitting = false;
      this.isLoading = false;
      return;
    }

    const payloaddata: InterviewPanelsResponse = {
      assessmentId: this.assessmentId,
      interviewId: Number(payload.interviewId),
      panel: this.selectedPanelForAssignment.panelName,
      interviewer: payload.interviewers,
    };
    this.interviewservice.updateinterviewpanel(payloaddata).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview panel updated successfully.',
        });
        // Close modal only on success
        this.ref.close({
          selectedpanel: this.selectedPanelIds,
          isAdd: false,
        });
      },
      error: (error: CustomErrorResponse) => {
        this.isSubmitting = false;
        this.isLoading = false;
        const errorMessage =
          error.error?.type ||
          error.error?.errorValue ||
          error.error?.message ||
          'Failed to update interview panel.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
        });
        // Keep modal open on error
      },
    });
  }

  public onClose() {
    this.ref.close(false);
  }
}
