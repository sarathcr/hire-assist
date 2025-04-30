import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { ButtonModule } from 'primeng/button';
import { QuestionFormGroup } from '../../../../../../models/question.model';
import { Metadata } from '../../../../../../../../shared/utilities/form.utility';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-question-form-modal',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputTextComponent,
    InputTextareaComponent,
    InputSelectComponent,
    ButtonComponent,
    ToggleSwitchComponent,
    ButtonModule,
  ],
  templateUrl: './question-form-modal.component.html',
  styleUrl: './question-form-modal.component.scss',
})
export class QuestionFormModalComponent implements OnInit, OnDestroy {
  public data!: QuestionFormGroup;
  public metadata!: Metadata[];
  public showTime = true;
  public isEdit = false;
  public questionForm!: FormGroup;

  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder,
  ) {
    this.questionForm = this.fb.group({
      options: this.fb.array([this.createOption()]),
    });
  }

  // LifeCycle Hooks

  ngOnInit(): void {
    this.data = this.config.data;
    console.log('===>', this.data);
  }

  ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  // Public Methods
  public addOption(): void {
    this.options.push(this.createOption());
  }

  public removeOption(index: number): void {
    if (this.options.length > 1) {
      this.options.removeAt(index);
    }
  }

  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref.close(this.data.fGroup.value);
    }
  }
  public onClose() {
    this.ref.close();
  }

  // Private Methods
  private createOption(): FormGroup {
    return this.fb.group({
      value: [''],
    });
  }
}
