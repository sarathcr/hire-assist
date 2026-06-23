import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextComponent } from '../../../../components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../components/form/input-textarea/input-textarea.component';
import { ExperienceDto } from '../../models/basic-information.model';
import { CustomTextareaConfig, CustomTextInputConfig, isFormUnchanged } from '../../../../utilities/form.utility';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-experience-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    FloatLabelModule,
    DatePickerModule,
    InputTextComponent,
    InputTextareaComponent
  ],
  templateUrl: './experience-dialog.component.html',
  styleUrl: './experience-dialog.component.scss'
})
export class ExperienceDialogComponent implements OnInit, OnDestroy {
  experienceForm: FormGroup;
  isEdit = false;
  maxDate = new Date();
  initialFormValue: any;
  private destroy$ = new Subject<void>();

  roleConfig: CustomTextInputConfig = {
    id: 'role',
    labelKey: 'Role / Job Title',
    maxlength: 100
  };

  companyConfig: CustomTextInputConfig = {
    id: 'company',
    labelKey: 'Company',
    maxlength: 100
  };

  descriptionConfig: CustomTextareaConfig = {
    id: 'description',
    labelKey: 'Description',
    maxlength: 500
  };

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig
  ) {
    this.experienceForm = this.fb.group({
      id: [0],
      role: ['', [Validators.required, Validators.maxLength(100), this.validNameValidator.bind(this), this.noTrailingSpacesValidator]],
      company: ['', [Validators.required, Validators.maxLength(100), this.validNameValidator.bind(this), this.noTrailingSpacesValidator]],
      startDate: [null, [Validators.required, this.dateValidator]],
      endDate: [null, [Validators.required, this.dateValidator]],
      isCurrent: [false],
      description: ['', [Validators.maxLength(500), this.noTrailingSpacesValidator]]
    }, { validators: [this.duplicateExperienceValidator.bind(this)] });
  }

  ngOnInit(): void {
    if (this.config.data?.experience) {
      this.isEdit = true;
      const exp = this.config.data.experience;
      this.experienceForm.patchValue({
        ...exp,
        startDate: exp.startDate ? new Date(exp.startDate) : null,
        endDate: exp.endDate ? new Date(exp.endDate) : null
      });
      
      if (exp.isCurrent) {
        this.experienceForm.get('endDate')?.clearValidators();
        this.experienceForm.get('endDate')?.setValidators([this.dateValidator]);
      } else {
        this.experienceForm.get('endDate')?.setValidators([Validators.required, this.dateValidator]);
      }
      this.experienceForm.get('endDate')?.updateValueAndValidity();
    }

    this.initialFormValue = this.experienceForm.getRawValue();

    this.experienceForm.get('isCurrent')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isCurrent => {
        const endDateControl = this.experienceForm.get('endDate');
        if (isCurrent) {
          endDateControl?.clearValidators();
          endDateControl?.setValidators([this.dateValidator]);
          endDateControl?.setValue(null);
        } else {
          endDateControl?.setValidators([Validators.required, this.dateValidator]);
        }
        endDateControl?.updateValueAndValidity();
        this.validateDates();
      });

    this.experienceForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());

    this.experienceForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validateDates());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isPristine(): boolean {
    return isFormUnchanged(this.experienceForm.getRawValue(), this.initialFormValue);
  }

  get isSaveDisabled(): boolean {
    return this.experienceForm.invalid || this.isPristine;
  }

  private validNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Reject if it's only numbers
    if (/^\d+$/.test(value.toString().trim())) {
      return { notOnlyNumbers: true };
    }

    // Must contain at least one letter (supports international characters)
    if (!/\p{L}/u.test(value.toString())) {
      return { invalidCharacters: true };
    }

    // Reject clearly invalid special characters (Allowing valid ones like: - . & , / ( ) + ' # !)
    const invalidCharsRegex = /[$%^*=~{}<>?"\\]/;
    if (invalidCharsRegex.test(value.toString())) {
      return { invalidCharacters: true };
    }

    return null;
  }

  private noTrailingSpacesValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const hasTrailingSpaces = control.value.toString().endsWith(' ');
    return hasTrailingSpaces ? { trailingSpaces: true } : null;
  }

  private dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selectedDate = new Date(control.value);
    return selectedDate > today ? { futureDate: true } : null;
  }

  private duplicateExperienceValidator(control: AbstractControl): ValidationErrors | null {
    const company = control.get('company')?.value?.trim().toLowerCase();
    const role = control.get('role')?.value?.trim().toLowerCase();
    const id = control.get('id')?.value;
    
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    const isCurrent = control.get('isCurrent')?.value;

    const existing = this.config.data?.existingExperiences || [];
    const errors: any = {};

    if (company && role) {
      const isDuplicateExperience = existing.some((exp: any) => 
        (id === 0 || exp.id !== id) && 
        exp.company?.trim().toLowerCase() === company &&
        exp.role?.trim().toLowerCase() === role
      );
      if (isDuplicateExperience) {
        errors.duplicateExperience = true;
      }
    }

    if (startDate) {
      const startM = new Date(startDate).getMonth();
      const startY = new Date(startDate).getFullYear();

      const isDuplicateDate = existing.some((exp: any) => {
        if (id !== 0 && exp.id === id) return false;
        
        const eStart = new Date(exp.startDate);
        const isStartMatch = eStart.getMonth() === startM && eStart.getFullYear() === startY;
        
        if (!isStartMatch) return false;

        if (isCurrent && exp.isCurrent) return true;
        if (!isCurrent && !exp.isCurrent && endDate && exp.endDate) {
          const eEnd = new Date(exp.endDate);
          const endM = new Date(endDate).getMonth();
          const endY = new Date(endDate).getFullYear();
          return (eEnd.getMonth() === endM && eEnd.getFullYear() === endY);
        }
        return false;
      });

      if (isDuplicateDate) {
        errors.duplicateDate = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private validateDates(): void {
    const startDate = this.experienceForm.get('startDate')?.value;
    const endDate = this.experienceForm.get('endDate')?.value;
    const isCurrent = this.experienceForm.get('isCurrent')?.value;

    if (!isCurrent && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        this.experienceForm.get('endDate')?.setErrors({ endDateInvalid: true });
      } else {
        const currentErrors = this.experienceForm.get('endDate')?.errors;
        if (currentErrors && currentErrors['endDateInvalid']) {
          delete currentErrors['endDateInvalid'];
          this.experienceForm.get('endDate')?.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
        }
      }
    }
  }

  private toLocalISOString(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  onSubmit(): void {
    if (this.experienceForm.valid) {
      const formValue = { ...this.experienceForm.value };
      
      if (formValue.startDate) {
        formValue.startDate = this.toLocalISOString(formValue.startDate);
      }
      
      if (formValue.endDate) {
        formValue.endDate = this.toLocalISOString(formValue.endDate);
      }
      
      this.ref.close(formValue);
    }
  }

  onCancel(): void {
    this.ref.close();
  }
}
