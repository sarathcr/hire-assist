/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import {
  CustomSelectConfig,
  Metadata,
} from '../../../../../../../../shared/utilities/form.utility';
import { QuestionFormGroup } from '../../../../../../models/question.model';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
@Component({
  selector: 'app-question-form-modal',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputTextComponent,
    InputTextareaComponent,
    InputSelectComponent,
    ToggleSwitchComponent,
    ButtonModule,
  ],
  templateUrl: './question-form-modal.component.html',
  styleUrl: './question-form-modal.component.scss',
})
export class QuestionFormModalComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: QuestionFormGroup;
  public metadata!: Metadata[];
  public showTime = true;
  public isEdit = false;
  public questionForm!: FormGroup;
  public optionsMap!: OptionsMap;
  public answer!: Option[];
  public get optionsArray(): FormArray<FormGroup> {
    return this.questionForm.get('options') as FormArray<FormGroup>;
  }

  constructor(
    private ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  // LifeCycle Hooks

  ngOnInit(): void {
    this.data = this.config.data;

    if (this.data) {
      this.questionForm = this.data.fGroup;

      const options = this.optionsArray;
      if (options.length === 0) {
        options.push(this.fb.group({ options: [''] }));
      }
    }
    this.subscribeToOptionArray();
    this.getFormData();
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  // Public Methods
  public addOption(): void {
    this.optionsArray.push(this.fb.group({ options: [''] }));
  }

  public removeOption(index: number): void {
    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.removeAt(index);
  }

  public onSubmit() {
    this.data.fGroup.markAllAsTouched();
    this.data.fGroup.updateValueAndValidity();
    if (this.data.fGroup.invalid) {
      return;
    }
    if (this.isEdit && this.ref) {
      this.ref.close({ ...this.data.fGroup.value, id: this.data.formData.id });
    } else {
      this.ref.close(this.data.fGroup.value);
      console.log('childRs', this.data.fGroup.value);
    }
  }
  public onClose() {
    this.ref.close(false);
  }

  // private Methods
  private subscribeToOptionArray() {
    const sub = this.data.fGroup.controls['options'].valueChanges.subscribe(
      (value) => {
        this.setAnswerFieldValue(value);
      },
    );
    this.subscriptionList.push(sub);
  }

  private setAnswerFieldValue(value: any) {
    const fieldValue = value
      ?.map((item: any) => ({
        label: item.options,
        value: item.options,
      }))
      .filter((item: any) => item?.label && item?.value);

    const oldConfig = this.data.configMap['answer'] as CustomSelectConfig;
    this.data.configMap['answer'] = {
      ...oldConfig,
      options: fieldValue,
    };

    this.data.fGroup.updateValueAndValidity();
  }

  private getFormData(): void {
    this.data = this.config.data;

    const id = this.data.formData?.id;
    console.log('id', this.data.formData?.id);
    if (id !== undefined) {
      this.validateCreateOrUpdateAssessment(id);
    }
  }

  private validateCreateOrUpdateAssessment(id: number): void {
    this.isEdit = id ? true : false;
    console.log('edit', this.isEdit);
    if (this.isEdit) this.setFormData();
  }

  private setFormData(): void {
    const formData = this.data.formData;

    this.data.fGroup.patchValue({
      questionText: formData.questionText,
      maxmark: formData.maxMark,
      answer: formData.answer,
      questionType: formData.questionType,
      active: formData.active,
      hasAttachments: formData.hasAttachment,
    });
    this.data.fGroup.updateValueAndValidity();
    console.log(this.data.fGroup.value);
    console.log('dataget', this.data.fGroup.get('questionType'));
    // Handle the options FormArray manually
    const optionsArray = this.optionsArray;
    optionsArray.clear();

    formData.options.forEach((optionText: string) => {
      optionsArray.push(this.fb.group({ options: [optionText] }));
    });
  }
}
