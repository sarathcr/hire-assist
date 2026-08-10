/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { Candidate } from '../../../../../../models/assessment-schedule.model';
import { BatchFormGroup } from '../../../../../../models/batch.model';
import { CreateBatchDataModel } from '../../../../../../models/CreateBatchDataModel';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';
import { CandidateModel } from '../../../../../../models/candidate-data.model';
import { debounceTime, forkJoin, finalize } from 'rxjs';
import { validateStartAndEndDates } from '../../../../../../../../shared/utilities/date.utility';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-create-batch-dialog',
  standalone: true,
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    CommonModule,
    InputSelectComponent,
    ButtonComponent,
    InputTextCalenderComponent,
    SkeletonModule
  ],
  templateUrl: './create-batch-dialog.component.html',
  styleUrl: './create-batch-dialog.component.scss',
})
export class CreateBatchDialogComponent implements OnInit {
  public candidateData: any;
  public fGroup!: FormGroup;
  public candidateDataModel = new CreateBatchDataModel();
  public configMap!: ConfigMap;
  public optionsMap!: OptionsMap;
  public batches: any[] = [];
  public questionSets: any[] = [];
  private originalDates: Record<string, Date> = {};
  public minDate: Date = new Date();
  public maxDate: Date | null = null;
  public isLoading = true;

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private assessmentService: AssessmentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fGroup = buildFormGroup(this.candidateDataModel);
    this.candidateData = this.config.data;
    
    if (this.config.data?.recruitmentStartDate) {
      const recStart = new Date(this.config.data.recruitmentStartDate);
      const today = new Date();
      this.minDate = recStart > today ? recStart : today;
    }
    if (this.config.data?.recruitmentEndDate) {
      this.maxDate = new Date(this.config.data.recruitmentEndDate);
    }

    this.createConfigMap();
    
    if (this.config.data?.batches$ && this.config.data?.questionSets$) {
      this.isLoading = true;
      forkJoin({
        batchesRes: this.config.data.batches$,
        questionSetsRes: this.config.data.questionSets$
      })
        .pipe(finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: ({ batchesRes, questionSetsRes }: any) => {
            this.batches = batchesRes?.data || batchesRes || [];
            this.questionSets = questionSetsRes?.data || questionSetsRes || [];
            this.setOptions();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.isLoading = false;
      this.setOptions();
    }

    this.fGroup.get('batch')?.valueChanges.subscribe((val) => {
      this.updateDatesFromBatch(val);
    });
  }

  private setOptions() {
    (this.configMap['batch'] as CustomSelectConfig).options = this.batches.map(
      (batch: any) => ({
        label: batch.title,
        value: batch.id.toString(),
      }),
    );

    (this.configMap['questionSet'] as CustomSelectConfig).options =
      this.questionSets.map((qs: any) => ({
        label: qs.title,
        value: qs.id.toString(),
      }));
  }

  private createConfigMap() {
    this.configMap = {
      batch: {
        id: 'batch',
        labelKey: 'Select Batch',
        options: [],
      },
      startDate: {
        id: 'startDate',
        labelKey: 'Start Date',
      },
      endDate: {
        id: 'endDate',
        labelKey: 'End Date',
      },
      questionSet: {
        id: 'questionSet',
        labelKey: 'Question Set',
        options: [],
      },
    };
  }

  public hasPrefilledDates = false;

  private updateDatesFromBatch(batchId: string) {
    const selectedBatch = this.batches.find((b) => b.id.toString() === batchId);
    if (selectedBatch) {
      const start = selectedBatch.startDate ? new Date(selectedBatch.startDate) : null;
      const end = selectedBatch.endDate ? new Date(selectedBatch.endDate) : null;
      
      this.hasPrefilledDates = !!(start || end);

      // Adjust minDate if the prefilled start date is in the past, so the calendar input won't clear it
      if (start) {
        const recStart = this.config.data?.recruitmentStartDate ? new Date(this.config.data.recruitmentStartDate) : null;
        this.minDate = recStart && recStart < start ? recStart : start;
      } else {
        // Fallback to default minDate calculation
        if (this.config.data?.recruitmentStartDate) {
          const recStart = new Date(this.config.data.recruitmentStartDate);
          const today = new Date();
          this.minDate = recStart > today ? recStart : today;
        } else {
          this.minDate = new Date();
        }
      }

      this.fGroup.patchValue({
        startDate: start,
        endDate: end,
      });
      this.originalDates = {
        startDate: start || new Date(),
        endDate: end || new Date(),
      };
      this.cdr.detectChanges();
    } else {
      this.hasPrefilledDates = false;
    }
  }

  public isDateChanged(field: string): boolean {
    const current = this.fGroup.get(field)?.value;
    const original = this.originalDates[field];
    if (!current || !original) return false;
    return new Date(current).getTime() !== original.getTime();
  }

  public onClose() {
    this.ref.close();
  }

  public onSubmit() {
    this.fGroup.markAllAsTouched();
    if (this.fGroup.valid && this.fGroup.get('batch')?.value && this.fGroup.get('questionSet')?.value) {
      const val = this.fGroup.value;
      let endDate = val.endDate;
      if (endDate) {
        const end = new Date(endDate);
        if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
          end.setHours(23, 59, 59, 999);
          endDate = end;
        }
      }
      const payload = {
        batchId: Number(val.batch),
        questionSetId: Number(val.questionSet),
        startDate: val.startDate,
        endDate: endDate,
      };
      this.ref.close(payload);
    }
  }
}
