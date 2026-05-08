import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CalendarModule } from 'primeng/calendar';
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
    CalendarModule,
    InputTextComponent,
    InputTextareaComponent
  ],
  template: `
    <div class="experience-dialog">
      <form [formGroup]="experienceForm" (ngSubmit)="onSubmit()" class="experience-dialog__form">
        <div class="experience-dialog__content">
          <div class="experience-dialog__field">
            <app-input-text
              [formGroup]="experienceForm"
              [config]="roleConfig"
            ></app-input-text>
          </div>

          <div class="experience-dialog__field">
            <app-input-text
              [formGroup]="experienceForm"
              [config]="companyConfig"
            ></app-input-text>
          </div>

          <div class="experience-dialog__row">
            <div class="experience-dialog__field">
              <p-floatlabel variant="on">
                <p-calendar 
                  id="startDate" 
                  formControlName="startDate" 
                  [showIcon]="true" 
                  dateFormat="M yy" 
                  view="month" 
                  [maxDate]="maxDate"
                  [baseZIndex]="10000"
                  class="w-full"
                  [ngClass]="{'ng-invalid ng-dirty': experienceForm.get('startDate')?.touched && experienceForm.get('startDate')?.invalid}"
                ></p-calendar>
                <label for="startDate">Start Date</label>
              </p-floatlabel>
              @if (experienceForm.get('startDate')?.touched && experienceForm.get('startDate')?.errors) {
                <span class="experience-dialog__error">
                  @if (experienceForm.get('startDate')?.errors?.['required']) { This field is required. }
                  @else if (experienceForm.get('startDate')?.errors?.['futureDate']) { Date cannot be in the future. }
                </span>
              }
            </div>

            @if (!experienceForm.get('isCurrent')?.value) {
              <div class="experience-dialog__field">
                <p-floatlabel variant="on">
                  <p-calendar 
                    id="endDate" 
                    formControlName="endDate" 
                    [showIcon]="true" 
                    dateFormat="M yy" 
                    view="month" 
                    [maxDate]="maxDate"
                    [baseZIndex]="10000"
                    class="w-full"
                    [ngClass]="{'ng-invalid ng-dirty': experienceForm.get('endDate')?.touched && experienceForm.get('endDate')?.invalid}"
                  ></p-calendar>
                  <label for="endDate">End Date</label>
                </p-floatlabel>
                @if (experienceForm.get('endDate')?.touched && experienceForm.get('endDate')?.errors) {
                  <span class="experience-dialog__error">
                    @if (experienceForm.get('endDate')?.errors?.['required']) { This field is required. }
                    @else if (experienceForm.get('endDate')?.errors?.['futureDate']) { Date cannot be in the future. }
                    @else if (experienceForm.get('endDate')?.errors?.['endDateInvalid']) { End date cannot be before start date. }
                  </span>
                }
              </div>
            }
          </div>

          <div class="experience-dialog__field-checkbox">
            <p-checkbox formControlName="isCurrent" [binary]="true" inputId="isCurrent"></p-checkbox>
            <label for="isCurrent" class="ml-2">I am currently working in this role</label>
          </div>

          <div class="experience-dialog__field">
            <app-input-textarea
              [formGroup]="experienceForm"
              [config]="descriptionConfig"
            ></app-input-textarea>
          </div>
        </div>

        <footer class="experience-dialog__footer">
          <button pButton type="button" label="Cancel" class="p-button-outlined" (click)="onCancel()"></button>
          <button 
            pButton 
            type="submit" 
            [label]="isEdit ? 'Save Changes' : 'Add Experience'" 
            [disabled]="isSaveDisabled"
          ></button>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    .experience-dialog {
      display: flex;
      flex-direction: column;
      width: 100%;

      &__form {
        display: flex;
        flex-direction: column;
      }

      &__content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        overflow: visible;
      }

      &__field {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        ::ng-deep .p-floatlabel {
          width: 100%;
        }
        ::ng-deep input, ::ng-deep .p-calendar, ::ng-deep textarea {
          width: 100%;
        }
      }

      &__error {
        font-size: 0.75rem;
        color: #ef4444;
        margin-left: 0.25rem;
      }

      &__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      &__field-checkbox {
        display: flex;
        align-items: center;
        margin-top: -0.5rem;
        label {
          font-size: 0.9rem;
          color: #475569;
          cursor: pointer;
        }
      }

      &__footer {
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-shrink: 0;
        ::ng-deep .p-button {
          border-radius: 8px;
        }
      }
    }
  `]
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
      role: ['', [Validators.required, Validators.maxLength(100), this.notOnlyNumbersValidator, this.noTrailingSpacesValidator]],
      company: ['', [Validators.required, Validators.maxLength(100), this.notOnlyNumbersValidator, this.noTrailingSpacesValidator]],
      startDate: [null, [Validators.required, this.dateValidator]],
      endDate: [null, [this.dateValidator]],
      isCurrent: [false],
      description: ['', [Validators.maxLength(500), this.noTrailingSpacesValidator]]
    });
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

  private notOnlyNumbersValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isNumeric = /^\d+$/.test(control.value.toString().trim());
    return isNumeric ? { notOnlyNumbers: true } : null;
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

  onSubmit(): void {
    if (this.experienceForm.valid) {
      this.ref.close(this.experienceForm.value);
    }
  }

  onCancel(): void {
    this.ref.close();
  }
}
