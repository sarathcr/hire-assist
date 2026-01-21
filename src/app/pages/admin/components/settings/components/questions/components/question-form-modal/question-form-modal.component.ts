/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { Message } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { InputMultiselectComponent } from '../../../../../../../../shared/components/form/input-multiselect/input-multiselect.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
import { ToggleSwitchComponent } from '../../../../../../../../shared/components/form/toggle-switch/toggle-switch.component';
import { OptionsMap } from '../../../../../../../../shared/models/app-state.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../../../shared/models/option';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import {
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../../../shared/utilities/form.utility';
import { QuestionForm } from '../../../../../../models/question-form.model';
import {
  FileDto,
  FileFormGroup,
  FileInterface,
  QuestionFormGroup,
  Questionsinterface,
} from '../../../../../../models/question.model';
import { QuestionService } from '../../../../../../services/question.service';
import { FileUploadDialogComponentComponent } from '../file-upload-dialog-component/file-upload-dialog-component.component';

function attachmentRequiredValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const hasAttachments = control.get('hasAttachments')?.value;
  const fileDto = control.get('fileDto')?.value;

  if (!hasAttachments) {
    return null; // toggle OFF
  }

  if (!fileDto || (!fileDto.id && !fileDto.blobId)) {
    return { attachmentRequired: true };
  }

  return null;
}

function optionAttachmentRequiredValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const optionHasAttachments = control.get('optionHasAttachments')?.value;
  const optionsArray = control.get('options') as any;

  if (!optionHasAttachments) {
    return null; // toggle OFF
  }

  if (!optionsArray || !Array.isArray(optionsArray.controls)) {
    return { optionAttachmentsRequired: true };
  }

  // Check if at least one option has an attachment
  let hasAtLeastOneAttachment = false;
  optionsArray.controls.forEach((optionCtrl: AbstractControl) => {
    const fileDtoControl = optionCtrl.get('fileDto');
    if (!fileDtoControl) {
      return;
    }

    // fileDto can be FormArray or FormGroup
    let hasAttachment = false;
    if (fileDtoControl instanceof FormArray) {
      hasAttachment = fileDtoControl.length > 0 && fileDtoControl.at(0)?.value;
      if (hasAttachment) {
        const fileValue = fileDtoControl.at(0)?.value;
        hasAttachment = !!(fileValue?.id || fileValue?.blobId);
      }
    } else if (fileDtoControl.value) {
      const fileValue = fileDtoControl.value;
      hasAttachment = !!(fileValue?.id || fileValue?.blobId);
    }

    if (hasAttachment) {
      hasAtLeastOneAttachment = true;
    }
  });

  if (!hasAtLeastOneAttachment) {
    return { optionAttachmentsRequired: true };
  }

  return null;
}

function compositeAttachmentValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const questionError = attachmentRequiredValidator(control);
  const optionError = optionAttachmentRequiredValidator(control);

  if (questionError && optionError) {
    return { ...questionError, ...optionError };
  } else if (questionError) {
    return questionError;
  } else if (optionError) {
    return optionError;
  }

  return null;
}

// Constants
// Custom validator to check for duplicate option values
function duplicateOptionValidator(
  optionsArray: FormArray,
  currentIndex: number,
): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !optionsArray) {
      return null;
    }

    const currentValue = control.value.trim().toLowerCase();
    if (!currentValue) {
      return null; // Let required validator handle empty values
    }

    // Check if this value exists in any other option
    for (let i = 0; i < optionsArray.length; i++) {
      if (i === currentIndex) {
        continue; // Skip the current option
      }

      const otherOptionControl = optionsArray.at(i)?.get('options');
      if (otherOptionControl) {
        const otherValue = otherOptionControl.value?.trim().toLowerCase();
        if (otherValue && otherValue === currentValue) {
          return { duplicateOption: true };
        }
      }
    }

    return null;
  };
}

const OPTION_VALIDATORS = [
  Validators.required,
  Validators.pattern(/^(?!\s)(?=.*\S).+$/),
];

const MIN_OPTIONS_COUNT = 2;
const MAX_OPTIONS_COUNT = 7;

const DIALOG_BREAKPOINTS = {
  '960px': '75vw',
  '640px': '90vw',
};

const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
} as const;

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
    ButtonComponent,
    Tooltip,
    ProgressSpinnerModule,
    SkeletonModule,
    Message,
  ],
  templateUrl: './question-form-modal.component.html',
  styleUrl: './question-form-modal.component.scss',
})
export class QuestionFormModalComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  // Public Properties
  public data!: QuestionFormGroup;
  public questionForm?: FormGroup;
  public optionsMap!: OptionsMap;
  public isEdit = false;
  public isDeletingAttachment = false;
  public deletingOptionAttachments = new Map<number, boolean>();
  public isLoadingData = false;
  public isSubmitting = false;

  // Private Properties
  private configMap!: ConfigMap;
  private questionType!: Option[];
  private previousMultipleChoiceAnswers: string[] = [];
  private previewCallback?: (blodId: string, attachmentType: number) => void;
  private selectedOptionIndex: number | 'question' | null = null;
  private questionId?: number;
  private isDestroyed = false;

  // Getters
  public get optionsArray(): FormArray<FormGroup> {
    if (!this.questionForm) {
      return this.fb.array<FormGroup>([]);
    }
    return this.questionForm.get('options') as FormArray<FormGroup>;
  }

  constructor(
    public config: DynamicDialogConfig,
    public dialog: DialogService,
    public questionService: QuestionService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly ref: DynamicDialogRef,
    private readonly messageService: MessageService,
    private readonly storeService: StoreService,
  ) {
    super();
  }

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    this.initializeComponent();
    // Only setup form if data is available
    if (this.data && this.data.fGroup) {
      this.setupForm();
      this.setupMultipleChoiceToggle();
    }
  }


  override ngOnDestroy(): void {
    this.isDestroyed = true;
    this.messageService.clear();
    
    if (this.ref) {
      this.ref.close();
    }
    this.data.fGroup.reset();
    super.ngOnDestroy();
  }


  // ==================== Initialization Methods ====================

  private initializeComponent(): void {
    this.data = this.config.data;

    // Ensure data and fGroup exist
    if (!this.data || !this.data.fGroup) {
      console.error('QuestionFormModalComponent: data or fGroup is missing');
      return;
    }

    this.previewCallback = (this.config.data as any).previewCallback;
    this.isLoadingData = (this.config.data as any).isLoading || false;
    this.questionId = (this.config.data as any).questionId;
    this.isEdit = !!this.data.formData?.id || !!this.questionId;

    // If we have a questionId but no formData, we need to fetch it
    if (this.questionId && !this.data.formData) {
      // Ensure loading state is set
      this.isLoadingData = true;
      // Fetch question data if not provided
      this.fetchQuestionData();
    } else if (this.isEdit && this.data.formData) {
      // If we already have formData, initialize edit mode
      this.initializeEditMode();
    }
  }

  private fetchQuestionData(): void {
    // Ensure loading state is set and trigger change detection
    this.isLoadingData = true;
    this.cdr.detectChanges();

    this.questionService.getQuestion(this.questionId!).subscribe({
      next: (res: Questionsinterface) => {
        if (res) {
          // Update formData with fetched data
          this.data.formData = res;
          this.isLoadingData = false;
          // Initialize edit mode with the fetched data
          const collection = this.storeService.getCollection();
          this.optionsMap = collection as OptionsMap;
          this.questionType = this.optionsMap['questionType'] as Option[];
          this.setConfigMaps();
          this.setOptions();
          this.setFormData();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoadingData = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load question data',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private initializeEditMode(): void {
    const collection = this.storeService.getCollection();
    this.optionsMap = collection as OptionsMap;
    this.questionType = this.optionsMap['questionType'] as Option[];
    this.setConfigMaps();
    this.setOptions();
    this.loadFormData();
  }

  private setupForm(): void {
    this.questionForm = this.data.fGroup;

    this.questionForm.setValidators(compositeAttachmentValidator);

    this.setupQuestionAttachmentToggle();
    this.setupOptionAttachmentToggle();

    this.questionForm.get('fileDto')?.valueChanges.subscribe(() => {
      this.questionForm?.updateValueAndValidity();
    });

    this.initializeOptionsArray();
    this.subscribeToOptionArray();
  }

  private setupQuestionAttachmentToggle(): void {
    const hasAttachmentsControl = this.questionForm?.get('hasAttachments');
    if (!hasAttachmentsControl) return;

    // Assign the subscription to a variable and push to your cleanup list
    const sub = hasAttachmentsControl.valueChanges.subscribe(
      (newValue: boolean) => {
        if (newValue === false) {
          const fileDto = this.questionForm?.get('fileDto')?.value;
          if (this.hasQuestionAttachment(fileDto)) {
            hasAttachmentsControl.setValue(true, { emitEvent: false });

            // Use the fix from the previous step: Clear before adding
            this.messageService.clear();
            this.showWarningMessage(
              'Validation',
              'Please remove the question attachment before disabling the toggle.',
            );
          }
        }
      },
    );

    // Assuming BaseComponent uses subscriptionList
    this.subscriptionList.push(sub);
  }

  private setupOptionAttachmentToggle(): void {
    const optionHasAttachmentsControl = this.questionForm?.get(
      'optionHasAttachments',
    );
    if (!optionHasAttachmentsControl) return;

    const sub = optionHasAttachmentsControl.valueChanges.subscribe(
      (newValue: boolean) => {
        // If trying to disable the toggle
        if (!newValue) {
          if (this.hasAnyOptionAttachment()) {
            // Prevent disabling by reverting the value
            optionHasAttachmentsControl.setValue(true, { emitEvent: false });
            // Show warning toast only
            this.showWarningMessage(
              'Validation',
              'Please remove all option attachments before disabling the toggle.',
            );
            this.questionForm?.updateValueAndValidity();
            return;
          }
        }
        this.questionForm?.updateValueAndValidity();
      },
    );
    this.subscriptionList.push(sub);
  }

  private hasQuestionAttachment(fileDto: any): boolean {
    if (!fileDto) return false;
    return !!(fileDto.id || fileDto.blobId);
  }

  private hasAnyOptionAttachment(): boolean {
    const optionsArray = this.optionsArray;
    if (!optionsArray?.length) return false;

    for (let i = 0; i < optionsArray.length; i++) {
      const optionCtrl = optionsArray.at(i);
      const fileDtoControl = optionCtrl.get('fileDto');
      if (!fileDtoControl) continue;

      let hasAttachment = false;
      if (fileDtoControl instanceof FormArray) {
        if (fileDtoControl.length > 0) {
          const fileValue = fileDtoControl.at(0)?.value;
          hasAttachment = !!(fileValue?.id || fileValue?.blobId);
        }
      } else if (fileDtoControl.value) {
        const fileValue = fileDtoControl.value;
        hasAttachment = !!(fileValue?.id || fileValue?.blobId);
      }

      if (hasAttachment) {
        return true;
      }
    }

    return false;
  }

  private initializeOptionsArray(): void {
    const options = this.optionsArray;

    if (this.isEdit) {
      if (options.length === 0) {
        this.addDefaultOptions(options);
      }
    } else {
      options.clear();
      this.addDefaultOptions(options);
    }
  }

  private addDefaultOptions(options: FormArray<FormGroup>): void {
    const defaultOptions = [
      this.createOptionFormGroup(0),
      this.createOptionFormGroup(1),
    ];
    // Use setControl to add multiple options at once
    defaultOptions.forEach((option, index) => {
      options.insert(index, option);
    });
    
    // Validate all options after adding defaults
    this.validateAllOptionsForDuplicates();
  }

  private setupMultipleChoiceToggle(): void {
    this.data.fGroup
      .get('isMultipleChoice')
      ?.valueChanges.subscribe((isMultiple) => {
        this.handleMultipleChoiceChange(isMultiple);
      });
  }

  private handleMultipleChoiceChange(isMultiple: boolean): void {
    const answerControl = this.data.fGroup.get('answer');
    if (!answerControl) return;

    const currentValue = answerControl.value;

    if (isMultiple) {
      this.switchToMultipleChoice(answerControl, currentValue);
    } else {
      this.switchToSingleChoice(answerControl, currentValue);
    }
  }

  private switchToMultipleChoice(answerControl: any, currentValue: any): void {
    if (this.previousMultipleChoiceAnswers.length > 0) {
      answerControl.setValue(this.previousMultipleChoiceAnswers);
    } else if (currentValue && !Array.isArray(currentValue)) {
      answerControl.setValue([currentValue]);
    }
  }

  private switchToSingleChoice(answerControl: any, currentValue: any): void {
    if (Array.isArray(currentValue)) {
      this.previousMultipleChoiceAnswers = [...currentValue];
      answerControl.setValue(currentValue[0] || '');
    }
  }

  // ==================== Option Management ====================

  public addOption(): void {
    if (this.optionsArray.length >= MAX_OPTIONS_COUNT) {
      this.showWarningMessage(
        'Validation',
        'Allowed option count was exceeded.',
      );
      return;
    }

    const newIndex = this.optionsArray.length;
    const optionGroup = this.createOptionFormGroup(newIndex);
    this.optionsArray.push(optionGroup);
    
    // Re-validate all options after adding a new one
    this.validateAllOptionsForDuplicates();
    
    this.cdr.detectChanges();
  }

  public removeOption(index: number): void {
    if (this.optionsArray.length <= MIN_OPTIONS_COUNT) {
      this.showWarningMessage('Validation', 'At least 2 options are required.');
      return;
    }

    const removedOptionValue = this.optionsArray
      .at(index)
      ?.get('options')?.value;

    this.optionsArray.removeAt(index);

    this.resetAnswerIfOptionRemoved(removedOptionValue);

    // Re-validate all options after removing one
    this.validateAllOptionsForDuplicates();

    this.cdr.detectChanges();
  }

  private createOptionFormGroup(index?: number): FormGroup {
    const optionGroup = this.fb.group({
      options: ['', OPTION_VALIDATORS],
      isCorrect: [false],
      optionHasAttachments: [false],
      fileDto: this.fb.group({
        name: [''],
        attachmentType: [''],
      }),
    });

    // Add duplicate validator if we have the index
    if (index !== undefined) {
      this.addDuplicateValidator(optionGroup, index);
    }

    return optionGroup;
  }

  private addDuplicateValidator(optionGroup: FormGroup, index: number): void {
    const optionsControl = optionGroup.get('options');
    if (optionsControl) {
      // Add the duplicate validator
      optionsControl.setValidators([
        ...OPTION_VALIDATORS,
        duplicateOptionValidator(this.optionsArray, index),
      ]);
    }
  }

  private validateAllOptionsForDuplicates(): void {
    const optionsArray = this.optionsArray;
    if (!optionsArray) return;

    // Re-validate all options to catch duplicates
    optionsArray.controls.forEach((optionGroup, index) => {
      const optionsControl = optionGroup.get('options');
      if (optionsControl) {
        // Update validators with current index
        optionsControl.setValidators([
          ...OPTION_VALIDATORS,
          duplicateOptionValidator(optionsArray, index),
        ]);
        optionsControl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  // ==================== Keyboard Event Handlers ====================

  public handleQuestionAttachmentKeyDown(event: Event): void {
    this.handleKeyboardAction(event, () =>
      this.openAttachmentModal('question'),
    );
  }

  public handleQuestionPreviewKeyDown(event: Event): void {
    this.handleKeyboardAction(event, () => this.previewAttachment(null));
  }

  public handleQuestionDeleteKeyDown(event: Event): void {
    this.handleKeyboardAction(event, () => this.deleteQuestionAttachment());
  }

  public handleOptionAttachmentKeyDown(event: Event, index: number): void {
    this.handleKeyboardAction(event, () => this.openAttachmentModal(index));
  }

  public handleOptionPreviewKeyDown(event: Event, optionCtrl: FormGroup): void {
    this.handleKeyboardAction(event, () => this.previewAttachment(optionCtrl));
  }

  public handleRemoveOptionKeyDown(event: Event, index: number): void {
    this.handleKeyboardAction(event, () => this.removeOption(index));
  }

  public handleOptionDeleteKeyDown(event: Event, index: number): void {
    this.handleKeyboardAction(event, () => this.deleteOptionAttachment(index));
  }

  private handleKeyboardAction(event: Event, action: () => void): void {
    const keyboardEvent = event as KeyboardEvent;
    if (
      keyboardEvent.key === KEYBOARD_KEYS.ENTER ||
      keyboardEvent.key === KEYBOARD_KEYS.SPACE
    ) {
      keyboardEvent.preventDefault();
      action();
    }
  }

  // ==================== Attachment Management ====================

  public deleteOptionAttachment(optionIndex: number): void {
    const optionCtrl = this.optionsArray.at(optionIndex);
    this.isSubmitting = true;
    if (!optionCtrl) {
      this.showWarningMessage('Warning', 'Option not found');
      return;
    }

    const fileDto = this.getFileDtoFromOption(optionCtrl);
    if (!this.isValidFileDto(fileDto)) {
      this.showWarningMessage('Warning', 'No attachment found to delete');
      return;
    }

    // Type guard ensures fileDto is FileDto, not null
    this.confirmAndDeleteOptionAttachment(fileDto, optionIndex);
  }

  private getFileDtoFromOption(optionCtrl: FormGroup): FileDto | null {
    const fileArray = optionCtrl.get('fileDto') as FormArray;
    if (!fileArray || fileArray.length === 0) {
      return null;
    }
    return fileArray.at(0).value as FileDto | null;
  }

  private isValidFileDto(fileDto: FileDto | null): fileDto is FileDto {
    return (
      !!fileDto && !!(fileDto.id || fileDto.blobId) && !!fileDto.attachmentType
    );
  }

  private confirmAndDeleteOptionAttachment(
    fileDto: FileDto,
    optionIndex: number,
  ): void {
    const formTouchedState = this.storeFormTouchedState();

    const modalData: DialogData = {
      message:
        'Are you sure you want to delete this option attachment? This action cannot be undone.',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };

    const confirmRef = this.openDeleteConfirmationDialog(modalData);

    confirmRef?.onClose.subscribe((confirmed: boolean) => {
      this.restoreFormValidationStateWithoutBlur(formTouchedState);

      if (confirmed) {
        this.performOptionDelete(fileDto, optionIndex);
      } else {
        this.isSubmitting = false;
      }
    });
  }

  private performOptionDelete(fileDto: FileDto, optionIndex: number): void {
    this.deletingOptionAttachments.set(optionIndex, true);

    // Store scroll position and prevent auto-focus
    const scrollContainer = document.querySelector('.question-form__container');
    const scrollPosition = scrollContainer?.scrollTop || 0;
    const activeElementBeforeDelete = document.activeElement as HTMLElement;

    const deletePayload: FileDto = {
      ...fileDto,
      blobId: fileDto.blobId || fileDto.id,
    };

    this.questionService.deleteFiles(deletePayload).subscribe({
      next: () => {
        this.clearOptionAttachment(optionIndex);
        this.deletingOptionAttachments.set(optionIndex, false);
        this.cdr.detectChanges();
        this.isSubmitting = false;
        // Restore scroll position and prevent auto-focus
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollPosition;
          }
          // Prevent auto-focus to first element
          if (
            activeElementBeforeDelete &&
            document.body.contains(activeElementBeforeDelete)
          ) {
            activeElementBeforeDelete.blur();
          }
          this.showSuccessMessage(
            'Success',
            'Option attachment deleted successfully',
          );
        }, 0);
      },
      error: () => {
        this.deletingOptionAttachments.set(optionIndex, false);
        this.cdr.detectChanges();
        this.isSubmitting = false;
        // Restore scroll position and prevent auto-focus
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollPosition;
          }
          // Prevent auto-focus to first element
          if (
            activeElementBeforeDelete &&
            document.body.contains(activeElementBeforeDelete)
          ) {
            activeElementBeforeDelete.blur();
          }
          this.showErrorMessage('Error', 'Failed to delete option attachment');
        }, 0);
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  private clearOptionAttachment(optionIndex: number): void {
    const optionCtrl = this.optionsArray.at(optionIndex);
    if (optionCtrl) {
      const fileArray = optionCtrl.get('fileDto') as FormArray;
      fileArray.clear();
    }
  }

  public openAttachmentModal(index: number | 'question'): void {
    const formTouchedState = this.storeFormTouchedState();
    this.selectedOptionIndex = index;

    const attachmentForm = this.createAttachmentForm();
    const modalData = this.createFileFormGroupData(index, attachmentForm);

    document.body.style.overflow = 'hidden';

    const uploadRef = this.dialog.open(FileUploadDialogComponentComponent, {
      data: modalData,
      header: 'Upload file',
      width: '50vw',
      modal: true,
      focusOnShow: false, // Prevents autofocusing first input in the submodal
      focusTrap: false, // Prevents the submodal from "stealing" focus context
      closable: false,
      dismissableMask: false,
      styleClass: 'fileUpload__dialog',
      breakpoints: DIALOG_BREAKPOINTS,
    });

    uploadRef.onClose.subscribe((result: FileDto) => {
      document.body.style.overflow = 'auto';
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      this.restoreFormValidationStateWithoutBlur(formTouchedState);

      if (result) {
        this.handleAttachmentUploadResult(result, index);
      }
      this.selectedOptionIndex = null;
    });
  }

  private createAttachmentForm(): FormGroup {
    return this.fb.group({
      optionAttachmentType: [null, Validators.required],
      file: [null, Validators.required],
    });
  }

  private createFileFormGroupData(
    index: number | 'question',
    attachmentForm: FormGroup,
  ): FileFormGroup {
    const isQuestion = index === 'question';
    return {
      formData: {} as FileInterface,
      fGroup: attachmentForm,
      configMap: {
        file: this.data.configMap['file'],
        ...(isQuestion
          ? { attachmentType: this.data.configMap['attachmentType'] }
          : {}),
      },
    };
  }

  private handleAttachmentUploadResult(
    result: FileDto,
    index: number | 'question',
  ): void {
    if (typeof index === 'number') {
      this.setOptionAttachment(result, index);
    } else if (index === 'question') {
      this.setQuestionAttachment(result);
    }
  }

  private setOptionAttachment(result: FileDto, optionIndex: number): void {
    const optionCtrl = this.optionsArray.at(optionIndex);
    if (!optionCtrl) return;

    this.ensureFileDtoFormArray(optionCtrl);
    const fileDtosArray = optionCtrl.get('fileDto') as FormArray;
    fileDtosArray.clear();
    fileDtosArray.push(this.createFileDtoFormGroup(result));
  }

  private setQuestionAttachment(result: FileDto): void {
    if (!this.data.fGroup.contains('fileDto')) {
      this.data.fGroup.addControl('fileDto', this.fb.control(null));
    }
    this.data.fGroup.patchValue({ fileDto: result });
  }

  private ensureFileDtoFormArray(optionCtrl: FormGroup): void {
    const fileDtoControl = optionCtrl.get('fileDto');
    if (!fileDtoControl || !(fileDtoControl instanceof FormArray)) {
      optionCtrl.removeControl('fileDto');
      optionCtrl.addControl('fileDto', this.fb.array([]));
    }
  }

  private createFileDtoFormGroup(fileDto: FileDto): FormGroup {
    return this.fb.group({
      id: [fileDto.id],
      path: [fileDto.path],
      name: [fileDto.name],
      attachmentType: [fileDto.attachmentType],
    });
  }

  public previewAttachment(optionCtrl: FormGroup | null): void {
    const fileDto = this.getFileDtoForPreview(optionCtrl);

    if (fileDto?.id && fileDto?.attachmentType) {
      this.previewCallback?.(fileDto.id, fileDto.attachmentType);
    } else {
      this.showInfoMessage('Info', 'No image is uploaded for preview');
    }
  }

  private getFileDtoForPreview(optionCtrl: FormGroup | null): FileDto | null {
    if (optionCtrl) {
      const fileArray = optionCtrl.get('fileDto') as FormArray;
      return fileArray && fileArray.length > 0 ? fileArray.at(0).value : null;
    }
    return this.data.fGroup.get('fileDto')?.value || null;
  }

  public deleteQuestionAttachment(): void {
    const fileDto = this.data.fGroup.get('fileDto')?.value;
    this.isSubmitting = true;
    if (!this.isValidFileDto(fileDto)) {
      this.showWarningMessage('Warning', 'No attachment found to delete');
      return;
    }

    this.confirmAndDeleteQuestionAttachment(fileDto);
  }

  private confirmAndDeleteQuestionAttachment(fileDto: FileDto): void {
    const formTouchedState = this.storeFormTouchedState();

    const modalData: DialogData = {
      message:
        'Are you sure you want to delete this question image? This action cannot be undone.',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };

    const confirmRef = this.openDeleteConfirmationDialog(modalData);

    confirmRef?.onClose.subscribe((confirmed: boolean) => {
      this.restoreFormValidationStateWithoutBlur(formTouchedState);

      if (confirmed) {
        this.performQuestionDelete(fileDto);
      } else {
        this.isSubmitting = false;
      }
    });
  }

  private openDeleteConfirmationDialog(modalData: DialogData) {
    return this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Delete',
      width: '35vw',
      modal: true,
      focusOnShow: false,
      focusTrap: false,
      breakpoints: DIALOG_BREAKPOINTS,
      templates: {
        footer: DialogFooterComponent,
      },
    });
  }

  // ==================== Form State Management ====================

  private storeFormTouchedState(): Map<string, boolean> {
    const formTouchedState = new Map<string, boolean>();
    Object.keys(this.data.fGroup.controls).forEach((key) => {
      const control = this.data.fGroup.get(key);
      if (control) {
        formTouchedState.set(key, control.touched);
      }
    });
    return formTouchedState;
  }

  private restoreFormValidationStateWithoutBlur(
    formTouchedState: Map<string, boolean>,
  ): void {
    this.restoreTouchedStates(formTouchedState);
  }

  private restoreTouchedStates(formTouchedState: Map<string, boolean>): void {
    formTouchedState.forEach((wasTouched, key) => {
      const control = this.data.fGroup.get(key);
      if (control) {
        if (!wasTouched && control.touched) {
          control.markAsUntouched({ onlySelf: true });
        } else if (wasTouched && !control.touched) {
          control.markAsTouched({ onlySelf: true });
        }
      }
    });
  }

  private performQuestionDelete(fileDto: FileDto): void {
    this.isDeletingAttachment = true;

    // Store scroll position and prevent auto-focus
    const scrollContainer = document.querySelector('.question-form__container');
    const scrollPosition = scrollContainer?.scrollTop || 0;
    const activeElementBeforeDelete = document.activeElement as HTMLElement;

    const deletePayload: FileDto = {
      ...fileDto,
      blobId: fileDto.blobId || fileDto.id,
    };

    this.questionService.deleteFiles(deletePayload).subscribe({
      next: () => {
        this.data.fGroup.patchValue({ fileDto: null });
        this.isDeletingAttachment = false;
        this.cdr.detectChanges();
        // Restore scroll position and prevent auto-focus
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollPosition;
          }
          // Prevent auto-focus to first element
          if (
            activeElementBeforeDelete &&
            document.body.contains(activeElementBeforeDelete)
          ) {
            activeElementBeforeDelete.blur();
          }
          this.showSuccessMessage(
            'Success',
            'Question image deleted successfully',
          );
        }, 0);
      },
      error: () => {
        this.isDeletingAttachment = false;
        this.cdr.detectChanges();
        // Restore scroll position and prevent auto-focus
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollPosition;
          }
          // Prevent auto-focus to first element
          if (
            activeElementBeforeDelete &&
            document.body.contains(activeElementBeforeDelete)
          ) {
            activeElementBeforeDelete.blur();
          }
          this.showErrorMessage('Error', 'Failed to delete question image');
        }, 0);
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
  // ==================== Form Submission ====================

  public onSubmit(): void {
    this.validateAndCleanForm();
    if (this.data.fGroup.invalid) {
      return;
    }

    const formValue = this.prepareFormValue();
    this.ref.close(formValue);
  }

  public onClose(): void {
    this.ref.close(false);
  }

  private validateAndCleanForm(): void {
    this.data.fGroup.markAllAsTouched();
    this.data.fGroup.updateValueAndValidity();
    this.cleanQuestionText();
  }

  private cleanQuestionText(): void {
    const questionTextControl = this.data.fGroup.get('questionText');
    if (questionTextControl?.value) {
      const cleanedValue = questionTextControl.value
        .trim()
        .replaceAll(/\s{2,}/g, ' ');
      questionTextControl.setValue(cleanedValue);
    }
  }

  private prepareFormValue(): any {
    const rawValue = this.data.fGroup.getRawValue();

    const formattedOptions = rawValue.options.map((opt: any) => {
      const file = Array.isArray(opt.fileDto) ? opt.fileDto[0] : opt.fileDto;
      const hasActualFile = !!(file && (file.id || file.blobId));

      const optionPayload: any = {
        optionText: opt.options,
        isCorrect: Array.isArray(rawValue.answer)
          ? rawValue.answer.includes(opt.options)
          : rawValue.answer === opt.options,
        hasAttachment: hasActualFile,
        fileDto: hasActualFile ? file : null,
      };
      return optionPayload;
    });

    const finalPayload = {
      ...rawValue,
      options: formattedOptions,
      hasAttachment: !!(
        rawValue.fileDto &&
        (rawValue.fileDto.id || rawValue.fileDto.blobId)
      ),
      id: this.isEdit ? this.data.formData?.id : undefined,
    };

    return finalPayload;
  }

  private resetAnswerIfOptionRemoved(removedOption: string): void {
    const answerCtrl = this.data.fGroup.get('answer');
    if (!answerCtrl || !removedOption) return;

    const isMultiple = this.data.fGroup.get('isMultipleChoice')?.value;

    if (isMultiple && Array.isArray(answerCtrl.value)) {
      const updatedAnswers = answerCtrl.value.filter(
        (val: string) => val !== removedOption,
      );

      answerCtrl.setValue(updatedAnswers.length ? updatedAnswers : null);
    } else {
      if (answerCtrl.value === removedOption) {
        answerCtrl.setValue(null);
      }
    }

    answerCtrl.markAsTouched();
    answerCtrl.updateValueAndValidity();
  }

  // ==================== Form Data Management ====================

  private subscribeToOptionArray(): void {
    const sub = this.data.fGroup.controls['options'].valueChanges.subscribe(
      (value) => {
        this.updateAnswerFieldOptions(value);
        // Re-validate all options when any option changes
        this.validateAllOptionsForDuplicates();
      },
    );
    this.subscriptionList.push(sub);
  }

  private updateAnswerFieldOptions(value: any): void {
    const fieldValue = this.extractOptionsFromValue(value);
    const oldConfig = this.data.configMap['answer'] as CustomSelectConfig;
    this.data.configMap['answer'] = {
      ...oldConfig,
      options: fieldValue,
    };
    this.data.fGroup.updateValueAndValidity();
  }

  private extractOptionsFromValue(value: any): Option[] {
    return (
      value
        ?.map((item: any) => ({
          label: item.options,
          value: item.options,
        }))
        .filter((item: any) => item?.label && item?.value) || []
    );
  }

  private loadFormData(): void {
    this.data = this.config.data;
    const id = this.data.formData?.id;
    if (id !== undefined) {
      this.setFormData();
    }
  }

  private setFormData(): void {
    const formData = this.data.formData;
    this.patchFormValues(formData);
    this.ensureFileDtoControl(formData);
    this.loadOptions(formData);
    this.cdr.detectChanges();
  }

  private patchFormValues(formData: any): void {
    const selectedQuestionTypeLabel = this.getQuestionTypeValue(
      formData.questionType,
    );
    const isMultipleChoice = formData.isMultipleChoice ?? false;

    this.data.fGroup.patchValue({
      questionText: formData.questionText,
      maxmark: formData.maxMark,
      answer: this.normalizeAnswerValue(formData.answer, isMultipleChoice),
      questionType: selectedQuestionTypeLabel,
      active: formData.active,
      hasAttachments: formData.hasAttachment,
      fileDto: formData.file ?? null,
      isMultipleChoice: formData.isMultipleChoice,
      optionHasAttachments:
        formData.options?.some((opt: any) => opt.hasAttachment) ?? false,
    });
    this.data.fGroup.updateValueAndValidity();
  }

  private getQuestionTypeValue(questionType: string): string {
    return (
      this.questionType.find((type: Option) => type.label === questionType)
        ?.value || 'default'
    );
  }

  private normalizeAnswerValue(
    answer: string | string[],
    isMultipleChoice: boolean,
  ): string | string[] {
    if (isMultipleChoice) {
      return Array.isArray(answer) ? answer : [answer];
    }
    return Array.isArray(answer) ? answer[0] : answer;
  }

  private ensureFileDtoControl(formData: any): void {
    if (!this.data.fGroup.contains('fileDto')) {
      this.data.fGroup.addControl(
        'fileDto',
        this.fb.control(formData.file ?? null),
      );
    }
  }

  private loadOptions(formData: any): void {
    const optionsArray = this.optionsArray;
    optionsArray.clear();

    formData.options?.forEach((option: any, index: number) => {
      const optionGroup = this.createOptionFormGroupFromData(option, formData);
      // Add duplicate validator for loaded options
      this.addDuplicateValidator(optionGroup, index);
      optionsArray.push(optionGroup);
    });
    
    // Validate all options after loading
    this.validateAllOptionsForDuplicates();
  }

  private createOptionFormGroupFromData(option: any, formData: any): FormGroup {
    return this.fb.group({
      options: [option.optionText, OPTION_VALIDATORS],
      optionHasAttachments: [option.hasAttachment],
      isCorrect: [option.optionText === formData.answer],
      fileDto: this.fb.array(
        option.fileDto ? [this.createFileDtoFormGroup(option.fileDto)] : [],
      ),
    });
  }

  private setConfigMaps(): void {
    const { metadata } = new QuestionForm();
    this.configMap = metadata.configMap || {};
  }

  private setOptions(): void {
    (this.configMap['questionType'] as CustomSelectConfig).options = this
      .optionsMap['questionType'] as unknown as Option[];
  }

  // ==================== Utility Methods ====================

  private showWarningMessage(summary: string, detail: string): void {
    if (this.isDestroyed) return;

    this.messageService.clear();
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      sticky: false,
      life: 3000,
    });
  }

  private showSuccessMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
    });
  }

  private showErrorMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
    });
  }

  private showInfoMessage(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
    });
  }
}
