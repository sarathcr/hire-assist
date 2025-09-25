/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  ConfigMap,
  CustomSelectConfig,
  Metadata,
} from '../../../../../../../../shared/utilities/form.utility';
import { QuestionForm } from '../../../../../../models/question-form.model';
import {
  FileDto,
  FileFormGroup,
  FileInterface,
  FileRequest,
  QuestionFormGroup,
} from '../../../../../../models/question.model';
import { QuestionService } from '../../../../../../services/question.service';
import { FileUploadDialogComponentComponent } from '../file-upload-dialog-component/file-upload-dialog-component.component';

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
    FileUploadModule,
    FormsModule,
    InputMultiselectComponent,
  ],
  templateUrl: './question-form-modal.component.html',
  styleUrl: './question-form-modal.component.scss',
})
export class QuestionFormModalComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public uploadedFileName: string | undefined;
  public data!: QuestionFormGroup;
  public fileData!: FileFormGroup;
  public metadata!: Metadata[];
  public showTime = true;
  public isEdit = false;
  public questionForm!: FormGroup;
  public answer!: Option[];
  public selectedOptionIndex!: number | string | null;
  public attachmentValue!: string;
  private questionType!: Option[];
  public optionsMap!: OptionsMap;
  private previousMultipleChoiceAnswers: string[] = [];
  private previewCallback?: (blodId: string, attachmentType: number) => void;
  public get optionsArray(): FormArray<FormGroup> {
    return this.questionForm.get('options') as FormArray<FormGroup>;
  }

  constructor(
    public config: DynamicDialogConfig,
    public dialog: DialogService,
    public questionService: QuestionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ref: DynamicDialogRef,
    private messageService: MessageService,
    private storeService: StoreService,
  ) {
    super();
  }
  // LifeCycle Hooks

  ngOnInit(): void {
    this.data = this.config.data;
    this.previewCallback = (this.config.data as any).previewCallback;
    if (this.data) {
      this.questionForm = this.data.fGroup;
      const options = this.optionsArray;
      if (options.length === 0) {
        options.push(this.fb.group({ options: [''] }));
      }
      if (!this.isEdit) {
        options.clear();
        options.push(this.fb.group({ options: [''] }));
      }
    }
    this.subscribeToOptionArray();

    this.isEdit = this.data.formData?.id ? true : false;
    if (this.isEdit) {
      this.optionsMap =
        this.storeService.getCollection() as unknown as OptionsMap;
      this.questionType = this.optionsMap[
        'questionType'
      ] as unknown as Option[];
      this.setConfigMaps();
      this.setOptions();
      this.getFormData();
    }

    this.data.fGroup
      .get('isMultipleChoice')
      ?.valueChanges.subscribe((isMultiple) => {
        const answerControl = this.data.fGroup.get('answer');
        if (!answerControl) return;

        const currentValue = answerControl.value;

        if (isMultiple) {
          if (this.previousMultipleChoiceAnswers.length > 0) {
            answerControl.setValue(this.previousMultipleChoiceAnswers);
          } else {
            if (currentValue && !Array.isArray(currentValue)) {
              answerControl.setValue([currentValue]);
            }
          }
        } else {
          if (Array.isArray(currentValue)) {
            this.previousMultipleChoiceAnswers = [...currentValue];
            answerControl.setValue(currentValue[0] || '');
          }
        }
      });
  }

  override ngOnDestroy(): void {
    this.data.fGroup.reset();
  }

  // Public Methods
  public onFileChange(event: FileSelectEvent): void {
    const file = event.currentFiles[0];
    if (!file) return;

    this.uploadedFileName = file.name;

    const payload: FileRequest = {
      attachmentType: Number(this.fGroup.get('attachmentType')?.value),
      file: file,
    };

    this.questionService.uploadFiles(payload).subscribe({
      next: (uploadedFile: FileDto) => {
        this.fGroup.patchValue({ fileDto: uploadedFile });
        this.fGroup.updateValueAndValidity();
      },
    });
  }

  public addOption(): void {
    const optionGroup = this.fb.group({
      options: ['', Validators.required],
      isCorrect: [false],
      optionHasAttachments: [false],
      fileDto: this.fb.group({
        name: [''],
        attachmentType: [''],
      }),
    });
    this.optionsArray.push(optionGroup);
    this.cdr.detectChanges();
  }

  public removeOption(index: number): void {
    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.removeAt(index);
  }

  public openAttachmentModal(index: number | 'question'): void {
    this.selectedOptionIndex = index;
    const isQuestion = index === 'question';
    const attachmentForm = this.fb.group({
      optionAttachmentType: ['', Validators.required],
      file: [null, Validators.required],
    });

    const data: FileFormGroup = {
      formData: {} as FileInterface,
      fGroup: attachmentForm,
      configMap: {
        optionAttachmentType: this.data.configMap['optionAttachmentType'],
        file: this.data.configMap['file'],
        ...(isQuestion
          ? { attachmentType: this.data.configMap['attachmentType'] }
          : {
              optionAttachmentType: this.data.configMap['optionAttachmentType'],
            }),
      },
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(FileUploadDialogComponentComponent, {
      data: data,
      header: 'Upload File',
      width: '50vw',
      modal: true,
      styleClass: 'fileUpload__dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((result: FileDto) => {
      document.body.style.overflow = 'auto';
      if (!result) return;
      if (typeof this.selectedOptionIndex === 'number') {
        const optionCtrl = this.optionsArray.at(this.selectedOptionIndex);
        if (optionCtrl) {
          if (
            !optionCtrl.get('fileDto') ||
            !(optionCtrl.get('fileDto') instanceof FormArray)
          ) {
            optionCtrl.removeControl('fileDto');
            optionCtrl.addControl('fileDto', this.fb.array([]));
          }
          const fileDtosArray = optionCtrl.get('fileDto') as FormArray;
          fileDtosArray.clear();
          fileDtosArray.push(
            this.fb.group({
              id: [result.id],
              path: [result.path],
              name: [result.name],
              attachmentType: [result.attachmentType],
            }),
          );
        }
      }
      if (this.selectedOptionIndex === 'question') {
        if (this.data.fGroup) {
          if (!this.data.fGroup.contains('fileDto')) {
            this.data.fGroup.addControl('fileDto', this.fb.control(null));
          }
          this.data.fGroup.patchValue({ fileDto: result });
        }
      }

      this.selectedOptionIndex = null;
    });
  }

  public previewAttachment(optionCtrl: FormGroup | null) {
    let fileDto = null;
    if (optionCtrl) {
      const fileArray = optionCtrl.get('fileDto') as FormArray;
      if (fileArray && fileArray.length > 0) {
        fileDto = fileArray.at(0).value;
      }
    } else {
      fileDto = this.data.fGroup.get('fileDto')?.value;
    }
    if (fileDto?.id && fileDto?.attachmentType) {
      this.previewCallback?.(fileDto.id, fileDto.attachmentType);
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'No image is uploaded for preview',
      });
    }
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
    if (id !== undefined) {
      this.validateCreateOrUpdateAssessment(id);
    }
  }

  private validateCreateOrUpdateAssessment(id: number): void {
    this.isEdit = id ? true : false;
    if (this.isEdit) this.setFormData();
  }

  private setFormData(): void {
    const formData = this.data.formData;
    const selectedQuestionTypeLabel =
      this.questionType.find(
        (type: Option) => type.label === formData.questionType,
      )?.value || 'default';
    const isMultipleChoice = formData.isMultipleChoice ?? false;
    this.data.fGroup.patchValue({
      questionText: formData.questionText,
      maxmark: formData.maxMark,
      answer: isMultipleChoice
        ? Array.isArray(formData.answer)
          ? formData.answer
          : [formData.answer]
        : Array.isArray(formData.answer)
          ? formData.answer[0]
          : formData.answer,
      questionType: selectedQuestionTypeLabel,
      active: formData.active,
      hasAttachments: formData.hasAttachment,
      fileDto: formData.file ?? null,
      isMultipleChoice: formData.isMultipleChoice,
      optionHasAttachments:
        formData.options?.some((opt: any) => opt.hasAttachment) ?? false,
    });
    this.cdr.detectChanges();
    if (!this.data.fGroup.contains('fileDto')) {
      this.data.fGroup.addControl(
        'fileDto',
        this.fb.control(formData.file ?? null),
      );
    }

    this.data.fGroup.updateValueAndValidity();

    const optionsArray = this.optionsArray;
    optionsArray.clear();

    formData.options.forEach((option: any) => {
      optionsArray.push(
        this.fb.group({
          options: [option.optionText],
          optionHasAttachments: [option.hasAttachment],

          isCorrect: [option.optionText === formData.answer],
          fileDto: this.fb.array(
            option.fileDto
              ? [
                  this.fb.group({
                    id: [option.fileDto.id],
                    path: [option.fileDto.path],
                    name: [option.fileDto.name],
                    attachmentType: [option.fileDto.attachmentType],
                  }),
                ]
              : [],
          ),
        }),
      );
    });
    this.cdr.detectChanges();
  }
  private setConfigMaps(): void {
    const { metadata } = new QuestionForm();
    this.configMap = metadata.configMap || {};
  }
  private setOptions() {
    (this.configMap['questionType'] as CustomSelectConfig).options = this
      .optionsMap['questionType'] as unknown as Option[];
  }
}
