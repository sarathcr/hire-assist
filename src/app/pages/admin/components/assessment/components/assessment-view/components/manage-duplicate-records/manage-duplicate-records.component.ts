import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SplitterModule } from 'primeng/splitter';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import {
  CandidateData,
  DialogData,
} from '../../models/manage-duplicate-candidates.model';
import { ManageDuplicateRecordsService } from '../../services/manage-duplicate-records.service';
import { CandidateDetailsComponent } from '../candidate-details/candidate-details.component';

@Component({
  selector: 'app-manage-duplicate-records',
  imports: [
    AccordionModule,
    SplitterModule,
    ButtonComponent,
    NgClass,
    CandidateDetailsComponent,
  ],
  templateUrl: './manage-duplicate-records.component.html',
  styleUrl: './manage-duplicate-records.component.scss',
})
export class ManageDuplicateRecordsComponent implements OnInit {
  public data!: CandidateData[];
  public splitPanelList = signal<CandidateData[]>([]);
  public panelIdIncrementor = 1;
  public splitPanelRendered = signal(true);
  public selectedPanelId = signal<number | null>(null);
  public assessmentId!: string;

  constructor(
    public config: DynamicDialogConfig,
    private readonly ref: DynamicDialogRef,
    private readonly cdr: ChangeDetectorRef,
    private readonly manageDuplicateRecordsService: ManageDuplicateRecordsService,
    private readonly messageService: MessageService,
  ) {}

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setConfigData();
  }

  // Public Events
  public onDuplicateRecordClick(candidates: CandidateData[]) {
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

    this.updateCandidateData(selectedCandidate);
  }

  // Private Methods
  private setConfigData() {
    const configData = this.config.data as DialogData;
    this.data = configData.duplicateRecords;
    this.assessmentId = configData.assessmentId;
    if (this.data) {
      this.setPanelListData(this.data);
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
    const headers = Object.keys(selectedCandidate).filter(
      (key) => key !== 'panelId',
    );
    const values = headers.map((key) => `"${selectedCandidate[key]}"`);
    const csvContent = `${headers.join(',')}\n${values.join(',')}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'candidate.csv');

    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Created the User Successfully',
      });
      this.getSelectedCandidateEmail(selectedCandidate);
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode === 4001) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'User Already Exists',
        });
      } else
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Creation failed',
        });
    };
    this.manageDuplicateRecordsService
      .createEntity(
        formData,
        `candidates/import?asessmentId=${this.assessmentId}`,
      )
      .subscribe({ next, error });
  }

  private getSelectedCandidateEmail(selectedCandidate: CandidateData) {
    const selectedEmail = (
      selectedCandidate as unknown as Record<string, unknown>
    )['Email Id'];

    this.updateModifiedCandidateData(String(selectedEmail));
  }

  private updateModifiedCandidateData(selectedEmail: string) {
    this.data = this.data['filter'](
      (item: CandidateData) =>
        item['key'].toLowerCase() !== selectedEmail.toLowerCase(),
    );
    this.closeDialog();
  }

  private closeDialog() {
    if (this.data['length'] <= 0) {
      this.ref.close({
        status: 'successfully updated all the duplicate records',
        refresh: true,
      });
    }
  }
}
