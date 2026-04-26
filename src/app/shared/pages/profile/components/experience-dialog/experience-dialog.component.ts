import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextarea } from 'primeng/inputtextarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ExperienceDto } from '../../models/basic-information.model';

@Component({
  selector: 'app-experience-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    CheckboxModule,
    InputTextarea,
    FloatLabelModule
  ],
  template: `
    <div class="experience-dialog">
      <form [formGroup]="experienceForm" (ngSubmit)="onSubmit()" class="experience-dialog__form">
        <div class="experience-dialog__content">
          <div class="experience-dialog__field">
            <p-floatlabel variant="on">
              <input id="role" type="text" pInputText formControlName="role" class="w-full" />
              <label for="role">Role / Job Title</label>
            </p-floatlabel>
          </div>

          <div class="experience-dialog__field">
            <p-floatlabel variant="on">
              <input id="company" type="text" pInputText formControlName="company" class="w-full" />
              <label for="company">Company</label>
            </p-floatlabel>
          </div>

          <div class="experience-dialog__row">
            <div class="experience-dialog__field">
              <p-floatlabel variant="on">
                <p-calendar id="startDate" formControlName="startDate" [showIcon]="true" appendTo="body" dateFormat="M yy" view="month" class="w-full"></p-calendar>
                <label for="startDate">Start Date</label>
              </p-floatlabel>
            </div>

            @if (!experienceForm.get('isCurrent')?.value) {
              <div class="experience-dialog__field">
                <p-floatlabel variant="on">
                  <p-calendar id="endDate" formControlName="endDate" [showIcon]="true" appendTo="body" dateFormat="M yy" view="month" class="w-full"></p-calendar>
                  <label for="endDate">End Date</label>
                </p-floatlabel>
              </div>
            }
          </div>

          <div class="experience-dialog__field-checkbox">
            <p-checkbox formControlName="isCurrent" [binary]="true" inputId="isCurrent"></p-checkbox>
            <label for="isCurrent" class="ml-2">I am currently working in this role</label>
          </div>

          <div class="experience-dialog__field">
            <p-floatlabel variant="on">
              <textarea id="description" pInputTextarea formControlName="description" rows="4" class="w-full"></textarea>
              <label for="description">Description</label>
            </p-floatlabel>
          </div>
        </div>

        <footer class="experience-dialog__footer">
          <button pButton type="button" label="Cancel" class="p-button-outlined" (click)="onCancel()"></button>
          <button pButton type="submit" [label]="isEdit ? 'Save Changes' : 'Add Experience'" [disabled]="experienceForm.invalid"></button>
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
        overflow-y: auto;
        max-height: 65vh; // Constrain the content area
      }

    &__field {
      width: 100%;
      ::ng-deep .p-floatlabel {
        width: 100%;
      }
      ::ng-deep input, ::ng-deep .p-calendar, ::ng-deep textarea {
        width: 100%;
      }
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
export class ExperienceDialogComponent implements OnInit {
  experienceForm: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig
  ) {
    this.experienceForm = this.fb.group({
      id: [0],
      role: ['', Validators.required],
      company: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null],
      isCurrent: [false],
      description: ['']
    });

    this.experienceForm.get('isCurrent')?.valueChanges.subscribe(isCurrent => {
      const endDateControl = this.experienceForm.get('endDate');
      if (isCurrent) {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      } else {
        endDateControl?.setValidators([Validators.required]);
      }
      endDateControl?.updateValueAndValidity();
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
