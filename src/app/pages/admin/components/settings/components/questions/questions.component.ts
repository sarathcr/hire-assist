/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { FileComponent } from '../../../../../../shared/components/file/file.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { OptionsMap } from '../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../shared/models/option';
import { PaginatedPayload } from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedData,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
} from '../../../../../../shared/utilities/form.utility';
import { QuestionForm } from '../../../../models/question-form.model';
import {
  FileDto,
  OptionsInterface,
  Questionsinterface,
} from '../../../../models/question.model';
import { QuestionService } from '../../../../services/question.service';
import { InterviewService } from '../../../assessment/services/interview.service';
import { QuestionFormModalComponent } from './components/question-form-modal/question-form-modal.component';
import { CollectionService } from '../../../../../../shared/services/collection.service';
import { finalize } from 'rxjs/operators';
const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionText',
      displayName: 'Questions',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
      hasTextFilter: false,
    },
  ],
  displayedColumns: ['question', 'actions'],
  hasExpanded: true,
};
@Component({
  selector: 'app-questions',
  imports: [Toast, TableComponent, CommonModule, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss',
})
export class QuestionsComponent implements OnInit, OnDestroy {
  public data!: PaginatedData<any>;
  public columns: TableColumnsData = tableColumns;
  public questionFormData = new QuestionForm();
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public optionsMap!: OptionsMap;
  public questionType!: Option[];
  public attachmentType!: Option[];
  public optionAttachmentType!: Option[];
  private ref: DynamicDialogRef | undefined;
  public opt!: any;
  public ticketUrl = '';
  public previewImageUrls: Record<number, string[]> = {};
  public isImageLoadings: Record<number, boolean> = {};
  public questionId!: number;
  public isLoading = true;
  public questionFileData: Record<number, FileDto> = {};
  public optionFileData: Record<number, FileDto> = {};

  private currentPayload: PaginatedPayload = new PaginatedPayload();
  // Flag to prevent recursive calls when updating data programmatically
  private isUpdatingData = false;
  constructor(
    private readonly questionService: QuestionService,
    private readonly storeService: StoreService,
    private readonly messageService: MessageService,
    public dialog: DialogService,
    public interviewService: InterviewService,
    private readonly dataSourceService: TableDataSourceService<any>,
    private readonly collectionService: CollectionService,
  ) {
    this.fGroup = buildFormGroup(this.questionFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    // Initialize with pageSize 10 to match table's default and prevent duplicate calls
    const initialPayload = new PaginatedPayload();
    initialPayload.pagination.pageSize = 10;
    this.currentPayload = initialPayload;
    this.getAllPaginatedQuestion(initialPayload);
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.questionType = this.optionsMap['questionType'] as unknown as Option[];
    this.attachmentType = this.optionsMap['attachments'] as unknown as Option[];
    this.optionAttachmentType = this.optionsMap[
      'attachments'
    ] as unknown as Option[];
    this.setConfigMaps();
    this.setOptions();
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
  // Public Methods
  public onTablePayloadChange(payload: PaginatedPayload): void {
    // Prevent recursive calls when updating data programmatically
    if (this.isUpdatingData) {
      return;
    }
    this.currentPayload = {
      ...payload,
      pagination: {
        ...payload.pagination,
        pageNumber: 1,
      },
    };
    this.loadData(payload);
  }

  public openAddQuestionModal(): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      isChoice: true,
      previewCallback: this.previewFile.bind(this),
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(QuestionFormModalComponent, {
      data: data,
      header: 'Create question',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      focusTrap: false,

      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      document.body.style.overflow = 'auto';
      if (res) {
        const formValue = this.fGroup.value;
        formValue.active = true;
        const selectedQuestionTypeLabel =
          this.questionType.find(
            (type: Option) => type.value === formValue.questionType,
          )?.label || 'default';
        const isMultipleChoice = formValue.isMultipleChoice ?? false;
        const transformed = {
          questionText: formValue.questionText,
          maxMark: formValue.maxmark,
          options: formValue.options.map((o: any) => {
            const fileDtoArray = o.fileDto;
            return {
              optionText: o.options,
              hasAttachment: formValue.optionHasAttachments || false,
              isCorrect: o.options === formValue.answer,
              fileDto:
                Array.isArray(fileDtoArray) && fileDtoArray.length > 0
                  ? fileDtoArray[0]
                  : null,
            };
          }),
          answer: (() => {
            if (Array.isArray(formValue.answer)) {
              return formValue.answer;
            }
            if (formValue.answer) {
              return [formValue.answer];
            }
            return [];
          })(),
          active: formValue.active,
          hasAttachment: formValue.hasAttachments,
          questionType: selectedQuestionTypeLabel,
          isMultipleChoice: isMultipleChoice,
          fileDto: formValue.fileDto ?? null,
        };
        this.Createquestion(transformed);
      }
    });
  }
  public previewImage(file: FileDto, id: number): void {
    this.isImageLoadings[id] = true;
    this.interviewService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          const imageUrl = URL.createObjectURL(blob);
          if (!this.previewImageUrls[id]) {
            this.previewImageUrls[id] = [];
          }
          this.previewImageUrls[id].push(imageUrl);
          setTimeout(() => {
            this.isImageLoadings[id] = false;
          }, 300);
        },

        error: () => {
          this.isImageLoadings[id] = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load image',
          });
        },
      });
  }

  public loadQuestionImage(id: number): void {
    if (this.questionFileData[id] && !this.previewImageUrls[id]) {
      // Set loading state immediately to show loader
      this.isImageLoadings[id] = true;
      this.previewImage(this.questionFileData[id], id);
    }
  }

  public loadOptionImage(id: number): void {
    if (this.optionFileData[id] && !this.previewImageUrls[id]) {
      // Set loading state immediately to show loader
      this.isImageLoadings[id] = true;
      this.previewImage(this.optionFileData[id], id);
    }
  }
  public deleteQuestion(id: any) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the question?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '35vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });
    this.ref.onClose.subscribe((result) => {
      document.body.style.overflow = 'auto';
      if (result) {
        this.isLoading = true;
        // api call to delete the question
        const next = () => {
          this.storeService.setIsLoading(false);
          this.collectionService.deleteItemFromCollection('questions', id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Question Successfully',
          });
          this.isLoading = false;
          this.getAllPaginatedQuestion(this.currentPayload);
        };
        const error = (error: CustomErrorResponse) => {
          this.storeService.setIsLoading(false);
          this.isLoading = false;
          const businerssErrorCode = error.error.businessError;
          if (businerssErrorCode == 3108) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                'You cannot delete this question because it refers to the Recruitments',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Deletion is failed',
            });
          }
        };
        this.questionService.deleteQuestion(id).subscribe({ next, error });
      }
    });
  }

  public getByIdQuestion(data: number | any) {
    this.questionId = data.id;
    // Open modal immediately with loading state
    this.openEditQuestionModal(null, data.id);
  }
  public openEditQuestionModal(
    question: Questionsinterface | null,
    questionId?: number,
  ): void {
    const data = {
      fGroup: this.fGroup,
      formData: question || undefined,
      configMap: this.configMap,
      isChoice: true,
      questionType: this.questionType,
      previewCallback: this.previewFile.bind(this),
      isLoading: !question && !!questionId,
      questionId: questionId,
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(QuestionFormModalComponent, {
      data: data,
      header: 'Update Question',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      document.body.style.overflow = 'auto';
      if (res) {
        const raw = this.fGroup.value;
        const selectedQuestionTypeLabel =
          this.questionType.find(
            (type: Option) => type.value === raw.questionType,
          )?.label || 'default';
        const isMultipleChoice = raw.isMultipleChoice ?? false;
        const questionId = question?.id || this.questionId;
        const transformed = {
          id: questionId,
          questionText: raw.questionText,
          maxMark: raw.maxmark,
          options: raw.options.map((o: any) => ({
            optionText: o.options,
            hasAttachment: o.optionHasAttachments ?? false,
            isCorrect: o.options === raw.answer,
            fileDto:
              Array.isArray(o.fileDto) && o.fileDto.length > 0
                ? o.fileDto[0]
                : null,
          })),
          answer: (() => {
            if (Array.isArray(raw.answer)) {
              return raw.answer;
            }
            if (raw.answer) {
              return [raw.answer];
            }
            return [];
          })(),
          active: raw.active,
          isMultipleChoice: isMultipleChoice,
          hasAttachment: raw.hasAttachments,
          questionType: selectedQuestionTypeLabel,

          file: raw.fileDto ?? null,
        };

        this.Updatequestion(transformed);
      }
    });
  }

  public previewFile(blobId: string, attachmentType: number) {
    this.dialog.open(FileComponent, {
      header: 'Image Preview',
      width: '80vw',
      modal: true,
      focusOnShow: false,
      closable: true,
      styleClass: 'image-preview-dialog',
      data: { blobId, attachmentType },
      breakpoints: {
        '960px': '90vw',
        '640px': '95vw',
      },
    });
  }
  public getAllPaginatedQuestion(payload: PaginatedPayload) {
    this.isLoading = true;
    this.previewImageUrls = {};
    this.isImageLoadings = {};
    this.questionFileData = {};
    this.optionFileData = {};
    // Set flag before making the call to prevent recursive updates
    this.isUpdatingData = true;
    const next = (res: any) => {
      if (res) {
        const transformedData = res.data.map((item: Questionsinterface) => ({
          ...item,
          options: this.transformOptions(item.options),
          isExpanded: false,
          questionUrl: item.file?.url,
        }));
        res.data.forEach((response: any) => {
          if (response.hasAttachment && response.files) {
            // Store file data for lazy loading, don't load image yet
            this.questionFileData[response.id] = response.files;
          }
        });
        this.data = { ...res, data: transformedData };
      }
      this.isLoading = false;
      // Reset flag after data update to allow future user interactions
      setTimeout(() => {
        this.isUpdatingData = false;
      }, 150);
    };

    const error = () => {
      this.isLoading = false;
      this.isUpdatingData = false; // Reset flag on error
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'error in getting question details',
      });
    };

    this.questionService
      .paginationEntity(`Questionsummary`, payload)
      .subscribe({ next, error });
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/Questionsummary`);
  }

  private transformOptions(options: any): OptionsInterface[] {
    if (!options || !Array.isArray(options)) {
      return [];
    }
    this.opt = options.map((option: any) => ({
      id: option.optionId,
      optionText: option.optionText,
      hasAttachments: option.optionHasAttachment,
      isCorrect: option.isCorrect,
      blobId: option.optionBlobId,
      url: option.optionFileUrl,
      path: option.optionPath,
      name: option.optionFileName,
      attachmentType: option.optionsAttachmentTypeId,
    }));
    this.opt.forEach((opt: any) => {
      if (opt.hasAttachments && opt.blobId) {
        // Store file data for lazy loading, don't load image yet
        const file: FileDto = {
          blobId: opt.blobId,
          attachmentType: opt.attachmentType,
          name: opt.name,
          path: opt.path,
          url: opt.url,
        };
        this.optionFileData[opt.id] = file;
      }
    });
    return this.opt;
  }

  private Createquestion(payload: Questionsinterface) {
    this.isLoading = true;
    const next = (res: any) => {
      const questionData = (res as Questionsinterface) || payload;
      if (questionData?.id) {
        this.collectionService.updateCollection('questions', {
          id: questionData.id,
          title: questionData.questionText,
        });
      }
      this.storeService.setIsLoading(false);
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Created question Successfully',
        });
      }, 200);

      this.getAllPaginatedQuestion(this.currentPayload);
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode == 3106) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'This Question already exists. Please use a different question text.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Creation is failed',
        });
      }
    };

    this.questionService.addQuestion(payload).subscribe({ next, error });
  }

  private Updatequestion(payload: Questionsinterface) {
    this.isLoading = true;
    const next = (res: any) => {
      const questionData = (res as Questionsinterface) || payload;
      if (questionData?.id) {
        this.collectionService.updateCollection('questions', {
          id: questionData.id,
          title: questionData.questionText,
        });
      }
      this.storeService.setIsLoading(false);
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Updated question Successfully',
        });
      }, 200);

      this.getAllPaginatedQuestion(this.currentPayload);
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode == 3108) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            'You cannot update this question because it refers to the Recruitments',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Updation is failed',
        });
      }
    };
    this.questionService.updateQuestion(payload).subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    // Prevent recursive calls when updating data programmatically
    if (this.isUpdatingData) {
      return;
    }
    this.previewImageUrls = {};
    this.isImageLoadings = {};
    this.questionFileData = {};
    this.optionFileData = {};
    this.isUpdatingData = true;
    this.isLoading = true;
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => {
        this.isLoading = false;
        // Reset flag after data update
        setTimeout(() => {
          this.isUpdatingData = false;
        }, 100);
      }))
      .subscribe((response: any) => {
        const transformedData = response.data.map((item: Questionsinterface) => ({
          ...item,
          options: this.transformOptions(item.options),
          isExpanded: false,
          questionUrl: item.file?.url,
        }));

        response.data.forEach((response: any) => {
          if (response.hasAttachment && response.files) {
            // Store file data for lazy loading, don't load image yet
            this.questionFileData[response.id] = response.files;
          }
        });
        this.data = { ...response, data: transformedData };
      });
  }

  private setConfigMaps(): void {
    const { metadata } = new QuestionForm();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['questionType'] as CustomSelectConfig).options = this
      .optionsMap['questionType'] as unknown as Option[];
    (this.configMap['attachmentType'] as CustomSelectConfig).options = this
      .optionsMap['attachments'] as unknown as Option[];
    (this.configMap['optionAttachmentType'] as CustomSelectConfig).options =
      this.optionsMap['attachments'] as unknown as Option[];
  }
}
