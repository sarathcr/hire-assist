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
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  isFormUnchanged,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  interviewer,
  interviewerModal,
} from '../../../../../../models/interviewers-model';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InterviewService } from '../../../../../../services/interview.service';
import { CoordinatorPanelBridgeService } from '../../../../../../../coordinator/services/coordinator-panel-bridge.service';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
@Component({
  selector: 'app-assign-interviewers-dialogue',
  imports: [
    InputMultiselectComponent,
    ReactiveFormsModule,
    InputSelectComponent,
    ToastModule,
    ButtonComponent,
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
  public existingAssignments: any[] = [];
  private initialValue: any;
  constructor(
    private readonly ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly storeService: StoreService,
    public dialog: DialogService,
    private readonly messageService: MessageService,
    private readonly interviewService: InterviewService,
    private readonly coordinatorPanelBridgeService: CoordinatorPanelBridgeService,
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
    this.existingAssignments = this.config.data.existingAssignments || [];
    this.loadCollections();
    this.setConfigMaps();
    this.setOptions();

    if (this.isEdit) {
      // In coordinator view, the ID of the PanelSummary is the panel's ID
      const panelId =
        this.data.formData.panelId ||
        this.data.formData.id ||
        this.data.formData.panelName;
      const interviewers = this.data.formData.interviewers;
      this.fGroup.patchValue({
        interviewers: interviewers || [],
        panels: panelId ? String(panelId) : null,
      });
    } else {
      this.fGroup.patchValue({
        interviewers: [],
        panels: null,
      });
    }

    // Asynchronously fetch all existing assignments to bypass pagination limit
    const payload = {
      multiSortedColumns: [],
      filterMap: {},
      pagination: {
        pageNumber: 1,
        pageSize: -1,
      },
    };
    this.coordinatorPanelBridgeService
      .paginationEntity<any>('panel/activePanelSummary', payload)
      .subscribe({
        next: (res: any) => {
          const resData = (res.data || []).map((item: any) => {
            return {
              ...item,
              interviewerNames:
                item.interviewers?.map((i: any) => i.name).join(', ') ?? '',
              interviewers: item.interviewers ?? [],
              name: item.name || item.panelName || item.panel || item.title,
            };
          });
          this.existingAssignments = resData;
          this.setOptions();
        },
        error: () => {
          // Keep using the initial set of assignments from config.data
        },
      });
    this.initialValue = this.fGroup.value;
  }

  public get isUnchanged(): boolean {
    if (!this.isEdit) return false;
    return isFormUnchanged(this.fGroup.value, this.initialValue);
  }

  public get isDuplicate(): boolean {
    const formValue = this.fGroup.value;
    const selectedPanelId = formValue.panels;
    const selectedInterviewerIds = formValue.interviewers || [];

    if (!selectedPanelId || selectedInterviewerIds.length === 0) return false;

    return this.existingAssignments.some((assignment: any) => {
      if (
        this.isEdit &&
        String(assignment.id) === String(this.data.formData.id)
      ) {
        return false;
      }

      const assignmentPanelId = assignment.id || assignment.panelId;
      const assignmentInterviewerIds =
        assignment.interviewers?.map((i: any) => String(i.id)) || [];
      const currentSelectionIds = (
        Array.isArray(selectedInterviewerIds)
          ? selectedInterviewerIds
          : [selectedInterviewerIds]
      ).map(String);

      const panelsMatch = String(assignmentPanelId) === String(selectedPanelId);
      const interviewersMatch =
        currentSelectionIds.length === assignmentInterviewerIds.length &&
        currentSelectionIds.every((id: any) =>
          assignmentInterviewerIds.includes(id),
        );

      return panelsMatch && interviewersMatch;
    });
  }

  public get assignedConflictError(): string | null {
    const formValue = this.fGroup.value;
    const selectedPanelId = formValue.panels ? String(formValue.panels) : null;
    const selectedInterviewerIds: string[] = (
      Array.isArray(formValue.interviewers)
        ? formValue.interviewers
        : formValue.interviewers
          ? [formValue.interviewers]
          : []
    ).map(String);

    if (!selectedPanelId && selectedInterviewerIds.length === 0) return null;

    const currentPanelId = this.isEdit
      ? String(
          this.data?.formData?.panelId ||
            this.data?.formData?.id ||
            this.data?.formData?.panelName ||
            '',
        )
      : null;

    // 1. Check if the selected panel is already assigned to an interview
    if (selectedPanelId && selectedPanelId !== currentPanelId) {
      const assignedPanel = this.existingAssignments.find(
        (a: any) =>
          String(a.id || a.panelId) === selectedPanelId &&
          (a.status?.toLowerCase() === 'assigned' ||
            a.isAssigned === true ||
            a.originalStatus?.toLowerCase() === 'assigned'),
      );
      if (assignedPanel) {
        return `Panel '${assignedPanel.name || selectedPanelId}' is already assigned to an interview and cannot be selected.`;
      }
    }

    // 2. Check if any selected interviewer belongs to another assigned panel
    for (const interviewerId of selectedInterviewerIds) {
      const conflictPanel = this.existingAssignments.find((a: any) => {
        const pId = String(a.id || a.panelId);
        if (pId === currentPanelId) return false;
        const isAssigned =
          a.status?.toLowerCase() === 'assigned' ||
          a.isAssigned === true ||
          a.originalStatus?.toLowerCase() === 'assigned';
        if (!isAssigned) return false;
        return a.interviewers?.some(
          (i: any) => String(i.id) === String(interviewerId),
        );
      });
      if (conflictPanel) {
        const interviewerObj = this.interviewers?.find(
          (i) => String(i.value) === String(interviewerId),
        );
        const name = interviewerObj?.label || interviewerId;
        return `Interviewer '${name}' is already assigned to active panel '${conflictPanel.name || conflictPanel.id}'.`;
      }
    }

    return null;
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

    if (this.assignedConflictError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.assignedConflictError,
      });
      return;
    }

    if (
      this.assessmentId !== undefined &&
      this.assessmentId !== null &&
      this.interviewId !== undefined &&
      this.interviewId !== null
    ) {
      const formValue = this.fGroup.value;
      const panelId = formValue.panels ? Number(formValue.panels) : null;
      const interviewers = Array.isArray(formValue.interviewers)
        ? formValue.interviewers
        : formValue.interviewers
          ? [formValue.interviewers]
          : [];

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

      // First, call PanelAssignments API
      const panelAssignmentPayload = [
        {
          panelId: panelId,
          interviewers: interviewers,
        },
      ];

      this.coordinatorPanelBridgeService
        .addInterviewerPanels(panelAssignmentPayload)
        .subscribe({
          next: () => {
            // After successful PanelAssignments, call InterviewPanel API
            this.interviewService.createInterviewPanel(payload).subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Interview panel assigned successfully',
                });
                this.ref.close({ ...this.fGroup.value, submitted: true });
              },
              error: (error: any) => {
                const errorMessage =
                  error?.error?.errorValue ||
                  error?.error?.type ||
                  error?.error?.message ||
                  error?.message ||
                  'Failed to assign interview panel';
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: errorMessage,
                });
              },
            });
          },
          error: (error: any) => {
            const errorMessage =
              error?.error?.errorValue ||
              error?.error?.type ||
              error?.error?.message ||
              error?.message ||
              'Failed to update interviewers into panels';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
            });
          },
        });
      return;
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
    let interviewerOptions = this.optionsMap[
      'interviewers'
    ] as unknown as Option[];
    let panelOptions = this.optionsMap['panels'] as unknown as Option[];

    if (this.existingAssignments && this.existingAssignments.length > 0) {
      const currentPanelId = this.isEdit
        ? String(
            this.data?.formData?.panelId ||
              this.data?.formData?.id ||
              this.data?.formData?.panelName ||
              '',
          )
        : null;

      panelOptions = panelOptions.filter((p) => {
        const pId = String(p.value);
        if (currentPanelId && pId === currentPanelId) {
          return true;
        }

        const existing = this.existingAssignments.find(
          (a: any) => String(a.id || a.panelId) === pId,
        );

        if (!existing) {
          return true;
        }

        // Exclude if already assigned to an interview
        const isAssigned =
          existing.status?.toLowerCase() === 'assigned' ||
          existing.isAssigned === true ||
          existing.originalStatus?.toLowerCase() === 'assigned';
        if (isAssigned) {
          return false;
        }

        // For panel assignment dialog, panels that already have an assignment are not selectable
        return false;
      });

      const unavailableInterviewerIds = new Set<string>();
      this.existingAssignments.forEach((a: any) => {
        const panelId = String(a.id || a.panelId);
        if (currentPanelId && panelId === currentPanelId) {
          return;
        }

        const isAssigned =
          a.status?.toLowerCase() === 'assigned' ||
          a.isAssigned === true ||
          a.originalStatus?.toLowerCase() === 'assigned';

        // Interviewers in assigned panels are always unavailable.
        // In create mode (!isEdit), interviewers in any existing panel assignment are also unavailable.
        if (isAssigned || !this.isEdit) {
          a.interviewers?.forEach((i: any) =>
            unavailableInterviewerIds.add(String(i.id)),
          );
        }
      });

      interviewerOptions = interviewerOptions.filter(
        (i) => !unavailableInterviewerIds.has(String(i.value)),
      );
    }

    this.configMap = {
      ...this.configMap,
      interviewers: {
        ...this.configMap['interviewers'],
        options: interviewerOptions,
      } as CustomSelectConfig,
      panels: {
        ...this.configMap['panels'],
        options: panelOptions,
      } as CustomSelectConfig,
    };
  }

  private loadCollections() {
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.interviewers = this.optionsMap['interviewers'] as unknown as Option[];
    this.panels = this.optionsMap['panels'] as unknown as Option[];
  }
}
