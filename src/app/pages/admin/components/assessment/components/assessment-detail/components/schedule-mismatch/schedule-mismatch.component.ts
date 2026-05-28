import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    this.mismatchedCandidates = this.config.data?.mismatchedCandidates || [];
    
    // Set validation min date to today's date
    const now = new Date();
    this.minDate = new Date(now);
    this.minDate.setSeconds(0, 0);
    this.minDate.setMilliseconds(0);

    this.fGroup = this.fb.group({
      scheduleDate: [null, [Validators.required]]
    });

    this.fGroup.get('scheduleDate')?.valueChanges.subscribe((val) => {
      if (val) {
        const dateTime = new Date(val);
        if (dateTime < this.minDate) {
          this.dateError = 'Schedule Date & Time cannot be in the past.';
          this.fGroup.get('scheduleDate')?.setErrors({ invalidDate: true });
        } else {
          this.dateError = null;
        }
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
