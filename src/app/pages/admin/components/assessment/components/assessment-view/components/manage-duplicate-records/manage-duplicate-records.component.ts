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
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import {
  CandidateData,
  DialogData,
} from '../../models/manage-duplicate-candidates.model';
import { ManageDuplicateRecordsService } from '../../services/manage-duplicate-records.service';
import { CandidateDetailsComponent } from '../candidate-details/candidate-details.component';
import { CandidateDialogComponent } from '../candidate-dialog/candidate-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { validateVerhoeff } from '../../../../../../../../shared/utilities/verhoeff.utility';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';

@Component({
  selector: 'app-manage-duplicate-records',
  imports: [
    AccordionModule,
    SplitterModule,
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
  public nonEligibleGroups = computed(() => this.data().filter(g => g['isNonEligibleGroup']));
  
  public activeCategory = signal<'duplicate' | 'invalid' | 'noneligible'>('duplicate');

  // Duplicate Cluster Navigation
  public currentClusterIndex = computed(() => {
    const activeId = this.activeGroupId;
    return this.duplicateGroups().findIndex(g => g.groupId === activeId);
  });
  public isFirstCluster = computed(() => this.currentClusterIndex() <= 0);
  public isLastCluster = computed(() => this.currentClusterIndex() >= this.duplicateGroups().length - 1);

  public prevCluster() {
    const idx = this.currentClusterIndex();
    if (idx > 0) {
      const prevGroup = this.duplicateGroups()[idx - 1];
      this.onDuplicateRecordClick(prevGroup.candidates, prevGroup.groupId);
    }
  }

  public nextCluster() {
    const idx = this.currentClusterIndex();
    if (idx < this.duplicateGroups().length - 1) {
      const nextGroup = this.duplicateGroups()[idx + 1];
      this.onDuplicateRecordClick(nextGroup.candidates, nextGroup.groupId);
    }
  }

  public getGroupsForCategory(cat: 'duplicate' | 'invalid' | 'noneligible'): CandidateData[] {
    if (cat === 'duplicate') return this.duplicateGroups();
    if (cat === 'invalid') return this.invalidGroups();
    return this.nonEligibleGroups();
  }

  public setCategory(cat: 'duplicate' | 'invalid' | 'noneligible') {
    this.activeCategory.set(cat);
    this.selectedPanelId.set(null);
    const groups = this.getGroupsForCategory(cat);
    if (groups.length > 0) {
      this.onDuplicateRecordClick(groups[0].candidates, groups[0].groupId);
    } else {
      this.splitPanelList.set([]);
      this.activeGroupId = null;
    }
  }

  public splitPanelList = signal<CandidateData[]>([]);
  public panelIdIncrementor = 1;
  public splitPanelRendered = signal(true);
  public selectedPanelId = signal<number | null>(null);
  public isSelectedCandidateValid = computed(() => {
    const selectedId = this.selectedPanelId();
    if (!selectedId) return false;

    // Find candidate in data signal
    let selectedCandidate: CandidateData | null = null;
    let isFromInvalidGroup = false;
    for (const group of this.data()) {
      const found = group.candidates.find(c => c.panelId === selectedId);
      if (found) {
        selectedCandidate = found;
        isFromInvalidGroup = !!group['isInvalidGroup'];
        break;
      }
    }

    if (!selectedCandidate) return false;

    if (selectedCandidate['isInvalidRecord'] || isFromInvalidGroup) {
      const aadhaar = selectedCandidate['aadhaarNumber'] || selectedCandidate['Aadhaar Number'] || '';
      const cleaned = String(aadhaar).replace(/\s/g, '');
      return /^\d{12}$/.test(cleaned) && validateVerhoeff(cleaned);
    }

    return true;
  });

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
      this.splitPanelList.set(candidates);
      this.splitPanelRendered.set(true);
    });
  }

  public onDetailsClick(candidate: CandidateData) {
    if (candidate['isNonEligibleRecord']) {
      return;
    }
    this.selectedPanelId.set(candidate.panelId ?? null);
  }

  public onSubmit() {
    if (!this.isSelectedCandidateValid()) return;
    const selectedId = this.selectedPanelId();
    if (!selectedId) return;

    let selectedCandidate: CandidateData | null = null;
    for (const group of this.data()) {
      const found = group.candidates.find(c => c.panelId === selectedId);
      if (found) {
        selectedCandidate = found;
        break;
      }
    }
    if (!selectedCandidate) return;

    this.isLoading.set(true);
    this.updateCandidateData(selectedCandidate);
  }

  public onSaveRecord(candidate: CandidateData, groupId: string) {
    this.activeGroupId = groupId;
    this.selectedPanelId.set(candidate.panelId ?? null);

    // Validate Aadhaar format
    const aadhaar = candidate['aadhaarNumber'] || candidate['Aadhaar Number'] || '';
    const cleaned = String(aadhaar).replace(/\s/g, '');
    const isValid = /^\d{12}$/.test(cleaned) && validateVerhoeff(cleaned);

    if (!isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter a valid 12-digit Aadhaar number.',
      });
      return;
    }

    const modalData = {
      message: 'Are you sure you want to save and validate this candidate record?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Save',
    };

    const ref = this.dialogService.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Save',
      width: '400px',
      modal: true,
      templates: {
        footer: DialogFooterComponent,
      },
    });

    ref.onClose.subscribe((result) => {
      if (result) {
        this.isLoading.set(true);
        this.updateCandidateData(candidate);
      }
    });
  }

  public isAadhaarValid(candidate: CandidateData): boolean {
    const aadhaar = candidate['aadhaarNumber'] || candidate['Aadhaar Number'] || '';
    const cleaned = String(aadhaar).replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned) && validateVerhoeff(cleaned);
  }

  public onEditRecord(candidate: CandidateData, groupId: string) {
    this.activeGroupId = groupId;
    this.selectedPanelId.set(candidate.panelId ?? null);

    const fieldToEdit = 'aadhaarNumber';
    this.editPanelId.set(candidate.panelId ?? null);
    this.editFieldKey.set(fieldToEdit);
  }

  public handleCandidateUpdate(updatedCandidate: CandidateData) {
    this.data.update(groups => groups.map(g => ({
      ...g,
      candidates: g.candidates.map(c => c.panelId === updatedCandidate.panelId ? updatedCandidate : c)
    })));
    
    // Also update splitPanelList if this candidate was in it
    const updatedList = this.splitPanelList().map(c => {
      if (c.panelId === updatedCandidate.panelId) {
        return updatedCandidate;
      }
      return c;
    });
    this.splitPanelList.set(updatedList);
    
    this.cdr.detectChanges();
  }

  public handleEditCancel() {
    this.editPanelId.set(null);
    this.editFieldKey.set(null);
  }

  public onRejectRecord(candidate: CandidateData, groupId: string) {
    const modalData = {
      message: 'Are you sure you want to reject this candidate record?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Reject',
    };

    const ref = this.dialogService.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      width: '400px',
      modal: true,
      templates: {
        footer: DialogFooterComponent,
      },
    });

    ref.onClose.subscribe((result) => {
      if (result) {
        // Filter out the rejected candidate globally
        this.data.update(groups => groups.map(g => {
          if (g.groupId === groupId) {
            return {
              ...g,
              candidates: g.candidates.filter(c => c.panelId !== candidate.panelId)
            };
          }
          return g;
        }).filter(g => g.candidates.length > 0));

        this.activeGroupId = groupId;
        this.updateModifiedCandidateData();
      }
    });
  }

  public onClose() {
    if (this.data().length > 0) {
      const modalData = {
        message: 'Pending candidates details will be lost and cannot be scheduled. Are you sure you want to cancel?',
        isChoice: true,
        cancelButtonText: 'No',
        acceptButtonText: 'Yes, Cancel',
      };

      const ref = this.dialogService.open(DialogComponent, {
        data: modalData,
        header: 'Confirm Cancel',
        width: '400px',
        modal: true,
        templates: {
          footer: DialogFooterComponent,
        },
      });

      ref.onClose.subscribe((result) => {
        if (result) {
          this.ref.close({ refresh: true });
        }
      });
    } else {
      this.ref.close({ refresh: true });
    }
  }

  // Private Methods
  private setConfigData() {
    const configData = this.config.data as DialogData;
    this.assessmentId = configData.assessmentId;
    
    // Assign stable panelIds to all candidates across all groups
    let idCounter = 1;
    const records = configData.duplicateRecords.map(group => ({
      ...group,
      candidates: group.candidates.map(c => ({
        ...c,
        panelId: idCounter++,
        failureReason: group['failureReason'] || c['failureReason'] || c['reason']
      }))
    }));
    this.data.set(records);
    
    // Determine initial active category
    if (this.duplicateGroups().length > 0) {
      this.activeCategory.set('duplicate');
    } else if (this.invalidGroups().length > 0) {
      this.activeCategory.set('invalid');
    } else if (this.nonEligibleGroups().length > 0) {
      this.activeCategory.set('noneligible');
    }

    const groups = this.getGroupsForCategory(this.activeCategory());
    if (groups.length > 0) {
      this.activeGroupId = groups[0].groupId;
      this.splitPanelList.set(groups[0].candidates);
    }
  }

  private updateCandidateData(selectedCandidate: CandidateData) {
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
        '_detectedAadhaar',
        'isDuplicateGroup',
        'isInvalidGroup',
        'type'
      ].includes(key),
    );
    
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

    const next = (res: any) => {
      this.isLoading.set(false);
      
      // 1. Check if the candidate is already in another active recruitment
      if (res && res.nonEligibleCandidateList && res.nonEligibleCandidateList.length > 0) {
        const reason = res.nonEligibleCandidateList[0].reason || 'This candidate is already part of another active recruitment which is not completed.';
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: reason,
        });
        
        // Update the candidate's failureReason locally so the UI displays it immediately
        this.data.update(groups => groups.map(g => {
          if (g.groupId === this.activeGroupId) {
            return {
              ...g,
              candidates: g.candidates.map(c => {
                if (c.panelId === selectedCandidate.panelId) {
                  return {
                    ...c,
                    failureReason: reason
                  };
                }
                return c;
              })
            };
          }
          return g;
        }));
        
        return;
      }

      // 2. Check if the updated Aadhaar remains invalid
      if (res && res.invalidRecords && res.invalidRecords.length > 0) {
        const reason = res.invalidRecords[0].reason || 'The provided Aadhaar number is invalid.';
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: reason,
        });
        return;
      }

      this.messageService.add({
        severity: 'success',
        summary: res?.type || 'Success',
        detail: res?.message || 'Candidate updated successfully.',
      });
      this.updateModifiedCandidateData();
    };
    const error = (err: CustomErrorResponse) => {
      this.isLoading.set(false);
      const errorMessage = err?.error?.type || err?.error?.message || 'Operation failed';
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

    // Refresh active category and find next group
    const currentCat = this.activeCategory();
    let groups = this.getGroupsForCategory(currentCat);
    
    if (groups.length > 0) {
      this.onDuplicateRecordClick(groups[0].candidates, groups[0].groupId);
    } else {
      // Current category is finished, find the next non-empty category
      if (this.duplicateGroups().length > 0) {
        this.setCategory('duplicate');
      } else if (this.invalidGroups().length > 0) {
        this.setCategory('invalid');
      } else if (this.nonEligibleGroups().length > 0) {
        this.setCategory('noneligible');
      } else {
        // Everything is fully resolved!
        this.closeDialog();
      }
    }
  }

  private closeDialog() {
    this.ref.close({
      status: 'successfully updated all the duplicate records',
      refresh: true,
    });
  }
}
