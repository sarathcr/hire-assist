import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, computed, OnInit, signal } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SplitterModule } from 'primeng/splitter';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import {
  CandidateData,
  DialogData,
} from '../../models/manage-duplicate-candidates.model';
import { ManageDuplicateRecordsService } from '../../services/manage-duplicate-records.service';
import { CandidateDetailsComponent } from '../candidate-details/candidate-details.component';
import { CandidateDialogComponent } from '../candidate-dialog/candidate-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-manage-duplicate-records',
  imports: [
    AccordionModule,
    SplitterModule,
    ButtonComponent,
    NgClass,
    CandidateDetailsComponent,
    CardModule,
    BadgeModule,
    AvatarModule,
    DividerModule,
    TagModule,
    SkeletonModule,
    ProgressSpinnerModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './manage-duplicate-records.component.html',
  styleUrl: './manage-duplicate-records.component.scss',
})
export class ManageDuplicateRecordsComponent implements OnInit {
  public data = signal<CandidateData[]>([]);
  public duplicateGroups = computed(() => this.data().filter(g => g['isDuplicateGroup']));
  public invalidGroups = computed(() => this.data().filter(g => g['isInvalidGroup']));
  
  public splitPanelList = signal<CandidateData[]>([]);
  public panelIdIncrementor = 1;
  public splitPanelRendered = signal(true);
  public selectedPanelId = signal<number | null>(null);
  public assessmentId!: string;
  public isLoading = signal(false);
  
  // Inline edit state
  public editPanelId = signal<number | null>(null);
  public editFieldKey = signal<string | null>(null);
  
  public activeGroupId: string | null = null;

  // Helper method to get initials for avatar
  public getInitials(name: string): string {
    if (!name || name === 'N/A') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  constructor(
    public config: DynamicDialogConfig,
    private readonly ref: DynamicDialogRef,
    private readonly cdr: ChangeDetectorRef,
    private readonly manageDuplicateRecordsService: ManageDuplicateRecordsService,
    private readonly messageService: MessageService,
    private readonly dialogService: DialogService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setConfigData();
  }

  // Public Events
  public onDuplicateRecordClick(candidates: CandidateData[], groupId: string) {
    this.activeGroupId = groupId;
    this.selectedPanelId.set(null);
    this.splitPanelRendered.set(false);

    setTimeout(() => {
      this.alterCandidateData(candidates);
      this.splitPanelRendered.set(true);
    });
  }

  public onDetailsClick(candidate: CandidateData) {
    this.selectedPanelId.set(candidate.panelId ?? null);
  }

  public onSubmit() {
    const selectedId = this.selectedPanelId();
    if (!selectedId) return;

    const selectedCandidate = this.splitPanelList().find(
      (candidate) => candidate.panelId === selectedId,
    );
    if (!selectedCandidate) return;

    this.isLoading.set(true);
    this.updateCandidateData(selectedCandidate);
  }

  public onEditRecord(candidate: CandidateData) {
    // If it's an invalid Aadhaar record, focus on Aadhaar Number field
    const fieldToEdit = candidate['isInvalidRecord'] ? 'aadhaarNumber' : 'name';
    
    this.editPanelId.set(candidate.panelId ?? null);
    this.editFieldKey.set(fieldToEdit);
    
    // Smooth scroll to the field if possible (handled by browser focus in template)
    setTimeout(() => {
      const element = document.getElementById('field-' + fieldToEdit);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  public handleCandidateUpdate(updatedCandidate: CandidateData) {
    const updatedList = this.splitPanelList().map(c => {
      if (c.panelId === updatedCandidate.panelId) {
        return updatedCandidate;
      }
      return c;
    });
    
    this.splitPanelList.set(updatedList);
    this.editPanelId.set(null);
    this.editFieldKey.set(null);
    this.cdr.detectChanges();
  }

  public handleEditCancel() {
    this.editPanelId.set(null);
    this.editFieldKey.set(null);
  }

  public onRejectRecord(candidate: CandidateData) {
    const updatedList = this.splitPanelList().filter(c => c.panelId !== candidate.panelId);
    this.splitPanelList.set(updatedList);
    
    if (this.selectedPanelId() === candidate.panelId) {
      this.selectedPanelId.set(null);
    }

    if (updatedList.length === 0) {
      this.updateModifiedCandidateData();
    }
  }

  public onClose() {
    this.ref.close({ refresh: true });
  }

  // Private Methods
  private setConfigData() {
    const configData = this.config.data as DialogData;
    this.data.set(configData.duplicateRecords);
    this.assessmentId = configData.assessmentId;
    const currentData = this.data();
    if (currentData && currentData.length > 0) {
      this.activeGroupId = currentData[0].groupId;
      this.setPanelListData(currentData);
    }
  }

  private setPanelListData(data: CandidateData[]) {
    const initialList = data[0].candidates.map((candidate: CandidateData) => ({
      ...candidate,
      panelId: this.panelIdIncrementor++,
    }));
    this.splitPanelList.set(initialList);
  }

  private alterCandidateData(candidates: CandidateData[]) {
    const updatedCandidates = candidates.map((cand: CandidateData) => ({
      ...cand,
      panelId: this.panelIdIncrementor++,
    }));
    this.splitPanelList.set(updatedCandidates);
  }

  private updateCandidateData(selectedCandidate: CandidateData) {
    // Determine headers based on available data
    // If it's an invalid record, it might have internal property names
    const headers = Object.keys(selectedCandidate).filter(
      (key) => ![
        'panelId', 
        'groupId', 
        'isInvalidRecord', 
        'failureReason', 
        'candidates', 
        'visibleButtonIndices', 
        'disabledButtonIndices',
        'dynamicAnswers',
        'isDuplicateRecord',
        'Aadhaar Number',
        '_detectedAadhaar',
        'isDuplicateGroup',
        'isInvalidGroup',
        'type'
      ].includes(key),
    );
    
    // Helper to escape CSV values
    const escapeCsvValue = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const values = headers.map((key) => escapeCsvValue(selectedCandidate[key]));
    const csvContent = `\uFEFF${headers.join(',')}\n${values.join(',')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    


    const formData = new FormData();
    formData.append('file', blob, 'candidate.csv');

    const next = () => {
      this.isLoading.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Created the User Successfully',
      });
      this.updateModifiedCandidateData();
    };
    const error = (error: CustomErrorResponse) => {
      this.isLoading.set(false);
      const errorMessage = error?.error?.type || error?.error?.message || 'Operation failed';
       this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
        });
    };
    this.manageDuplicateRecordsService
      .createEntity(
        formData,
        `candidates/import?asessmentId=${this.assessmentId}`,
      )
      .subscribe({ next, error });
  }

  private updateModifiedCandidateData() {
    if (!this.activeGroupId) return;

    this.data.update((items) =>
      items.filter((item: CandidateData) => item.groupId !== this.activeGroupId),
    );
    this.activeGroupId = null;
    this.splitPanelList.set([]);

    // Auto-select next group if available
    const remaining = this.data();
    if (remaining.length > 0) {
      const nextGroup = remaining[0];
      this.onDuplicateRecordClick(nextGroup.candidates, nextGroup.groupId);
    }
  }

  private closeDialog() {
    this.ref.close({
      status: 'successfully updated all the duplicate records',
      refresh: true,
    });
  }
}
