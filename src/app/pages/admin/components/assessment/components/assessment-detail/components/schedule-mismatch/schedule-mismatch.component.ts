import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputTextCalenderComponent } from '../../../../../../../../shared/components/form/input-text-calender/input-text-calender.component';

@Component({
  selector: 'app-schedule-mismatch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputTextCalenderComponent
  ],
  templateUrl: './schedule-mismatch.component.html',
  styleUrl: './schedule-mismatch.component.scss'
})
export class ScheduleMismatchComponent implements OnInit {
  public fGroup!: FormGroup;
  public mismatchedCandidates: any[] = [];
  public minDate!: Date;
  public maxDate!: Date;
  public isLoading = false;
  public dateError: string | null = null;

  public configMap = {
    scheduleDate: { id: 'scheduleDate', labelKey: 'Select Date & Time' }
  };

  constructor(
    private fb: FormBuilder,
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    const rawCandidates = this.config.data?.mismatchedCandidates || [];
    const datePipe = new DatePipe('en-US');
    
    this.mismatchedCandidates = rawCandidates.map((candidate: any) => {
      if (!candidate.message && candidate.scheduledDate && candidate.batchStartDate && candidate.batchEndDate) {
        const toUTCStr = (d: string) => d ? (d.endsWith('Z') ? d : `${d}Z`) : d;
        
        const schedStr = datePipe.transform(toUTCStr(candidate.scheduledDate), 'dd MMM yyyy hh:mm a');
        const startStr = datePipe.transform(toUTCStr(candidate.batchStartDate), 'dd MMM yyyy hh:mm a');
        const endStr = datePipe.transform(toUTCStr(candidate.batchEndDate), 'dd MMM yyyy hh:mm a');
        candidate.message = `Schedule date (${schedStr}) must be between the assigned batch start date (${startStr}) and end date (${endStr}).`;
      }
      return candidate;
    });

    // Find the overlap range for all mismatched candidates
    let batchMinStart: Date | null = null;
    let batchMaxEnd: Date | null = null;

    for (const candidate of this.mismatchedCandidates) {
      if (candidate.batchStartDate) {
        const start = new Date(candidate.batchStartDate.endsWith('Z') ? candidate.batchStartDate : `${candidate.batchStartDate}Z`);
        if (!batchMinStart || start > batchMinStart) {
          batchMinStart = start;
        }
      }
      if (candidate.batchEndDate) {
        const end = new Date(candidate.batchEndDate.endsWith('Z') ? candidate.batchEndDate : `${candidate.batchEndDate}Z`);
        if (!batchMaxEnd || end < batchMaxEnd) {
          batchMaxEnd = end;
        }
      }
    }

    const now = new Date();
    now.setSeconds(0, 0);
    now.setMilliseconds(0);

    // Set validation min and max dates
    if (batchMinStart && batchMinStart > now) {
      this.minDate = batchMinStart;
    } else {
      this.minDate = now;
    }

    if (batchMaxEnd) {
      this.maxDate = batchMaxEnd;
    }

    this.fGroup = this.fb.group({
      scheduleDate: [null, [Validators.required]]
    });

    this.fGroup.get('scheduleDate')?.valueChanges.subscribe((val) => {
      if (val) {
        const dateTime = new Date(val);
        if (dateTime < this.minDate) {
          this.dateError = 'Schedule Date & Time cannot be in the past.';
          this.fGroup.get('scheduleDate')?.setErrors({ invalidDate: true });
          return;
        }

        // Validate against each mismatched candidate's batch start/end dates
        for (const candidate of this.mismatchedCandidates) {
          if (candidate.batchStartDate && candidate.batchEndDate) {
            const start = new Date(candidate.batchStartDate.endsWith('Z') ? candidate.batchStartDate : `${candidate.batchStartDate}Z`);
            const end = new Date(candidate.batchEndDate.endsWith('Z') ? candidate.batchEndDate : `${candidate.batchEndDate}Z`);
            if (dateTime < start || dateTime > end) {
              const datePipe = new DatePipe('en-US');
              const startStr = datePipe.transform(start, 'dd MMM yyyy hh:mm a');
              const endStr = datePipe.transform(end, 'dd MMM yyyy hh:mm a');
              this.dateError = `Selected date must be between ${startStr} and ${endStr}.`;
              this.fGroup.get('scheduleDate')?.setErrors({ invalidRange: true });
              return;
            }
          }
        }

        this.dateError = null;
      }
    });
  }

  public onClose(): void {
    this.ref.close();
  }

  public onSubmit(): void {
    this.fGroup.markAllAsTouched();
    const isFormValid = this.fGroup.valid;

    if (isFormValid && !this.isLoading && this.config.data?.onSubmit) {
      this.isLoading = true;
      const selectedDate = this.fGroup.value.scheduleDate;
      this.config.data.onSubmit(selectedDate);
    }
  }

  public getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
