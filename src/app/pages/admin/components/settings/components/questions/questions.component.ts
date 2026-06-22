/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs/operators';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { FileComponent } from '../../../../../../shared/components/file/file.component';
import { HistoryDrawerComponent } from '../../../../../../shared/components/history-drawer/history-drawer.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { OptionsMap } from '../../../../../../shared/models/app-state.models';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../shared/models/option';
import { getDefaultPayload, PaginatedPayload, setSavedPayload } from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedData,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { CollectionService } from '../../../../../../shared/services/collection.service';
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
const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionText',
      displayName: 'Questions',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
      width: 6,
    },
    {
      field: 'questionType',
      displayName: 'Question Type',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: false,
      width: 2,
    },
    {
      field: 'maxMark',
      displayName: 'Max Mark',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: false,
      width: 1,
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: ['pi pi-pencil', 'pi pi-trash', 'pi pi-history'],
      buttonLabels: ['Edit', 'Delete', 'History'],
      buttonTooltips: ['Edit', 'Delete', 'History'],
      sortedColumn: false,
      hasChip: false,
      hasTextFilter: false,
      width: 1,
    },
  ],
  displayedColumns: ['question', 'actions'],
  hasExpanded: true,
};
@Component({
  selector: 'app-questions',
  imports: [
    TableComponent,
    CommonModule,
    ButtonComponent,
    HistoryDrawerComponent,
  ],
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
  public visible: boolean = false;
  private previousFilterMap: any = {};
  private currentPayload: PaginatedPayload = new PaginatedPayload();
  public historyEvents: any[] = [];
  public historyPagination = {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
  };
  public historyLoading: boolean = false;
  public currentHistoryQuestionId!: number;
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
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.fGroup = buildFormGroup(this.questionFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    // Initialize with pageSize 10 to match table's default and prevent duplicate calls
    const initialPayload = getDefaultPayload('QuestionsComponent');
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
    const isSearch =
      JSON.stringify(payload.filterMap) !==
      JSON.stringify(this.previousFilterMap);

    if (isSearch) {
      payload.pagination.pageNumber = 1;
    }

    this.previousFilterMap = JSON.parse(JSON.stringify(payload.filterMap));
    this.currentPayload = payload;
    setSavedPayload('QuestionsComponent', payload);
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
      header: 'Create Question',
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
          options: res.options,
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
    this.isImageLoadings = { ...this.isImageLoadings, [id]: true };
    this.cdr.detectChanges();
    this.questionService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          const imageUrl = URL.createObjectURL(blob);
          const currentUrls = this.previewImageUrls[id] ? [...this.previewImageUrls[id]] : [];
          currentUrls.push(imageUrl);
          this.previewImageUrls = { ...this.previewImageUrls, [id]: currentUrls };
          this.isImageLoadings = { ...this.isImageLoadings, [id]: false };
          this.cdr.detectChanges();
        },

        error: () => {
          this.isImageLoadings = { ...this.isImageLoadings, [id]: false };
          this.cdr.detectChanges();
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
      this.isImageLoadings = { ...this.isImageLoadings, [id]: true };
      this.cdr.detectChanges();
      this.previewImage(this.questionFileData[id], id);
    }
  }

  public loadOptionImage(id: number): void {
    if (this.optionFileData[id] && !this.previewImageUrls[id]) {
      // Set loading state immediately to show loader
      this.isImageLoadings = { ...this.isImageLoadings, [id]: true };
      this.cdr.detectChanges();
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
              detail:
                error.error.type ||
                error.error.message ||
                error.error.errorValue ||
                'Deletion is failed',
            });
          }
          this.getAllPaginatedQuestion(this.currentPayload);
        };
        this.questionService.deleteQuestion(id).subscribe({ next, error });
      }
    });
  }
  public viewQuestionHistory(id: any) {
    this.currentHistoryQuestionId = id;
    this.historyEvents = [];
    this.historyPagination.pageNumber = 1;
    this.fetchQuestionHistory(id, 1);
    this.visible = true;
  }

  public fetchQuestionHistory(questionId: number, pageNumber: number) {
    const payload = new PaginatedPayload();
    payload.pagination.pageNumber = pageNumber;
    payload.pagination.pageSize = this.historyPagination.pageSize;
    payload.filterMap = { questionId: questionId };
    payload.multiSortedColumns = [{ active: 'ChangedAt', direction: 'desc' }];

    this.historyLoading = true;
    this.questionService
      .getQuestionHistoryPaginated(payload)
      .pipe(finalize(() => (this.historyLoading = false)))
      .subscribe({
        next: (res: any) => {
          const events = res.data.map((item: any) => ({
            status: item.action,
            user: item.changedByName,
            date: new Date(item.changedAt ? item.changedAt + (item.changedAt.endsWith('Z') ? '' : 'Z') : new Date()),
            icon: this.getHistoryIcon(item.action),
            description: this.getHistoryDescription(item),
          }));

          if (pageNumber === 1) {
            this.historyEvents = events;
          } else {
            this.historyEvents = [...this.historyEvents, ...events];
          }
          this.historyPagination.totalRecords = res.totalRecords;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch question history',
          });
        },
      });
  }

  private getHistoryIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'created':
        return 'pi pi-plus';
      case 'updated':
        return 'pi pi-pencil';
      case 'deleted':
        return 'pi pi-trash';
      default:
        return 'pi pi-info-circle';
    }
  }

  private getHistoryDescription(item: any): string {
    if (
      item.field &&
      item.previousValue !== undefined &&
      item.currentValue !== undefined
    ) {
      const formatVal = (v: any) => {
        if (v === '' || v === null || v === undefined) return 'null';
        if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') {
          return Number(v).toString();
        }
        if (typeof v === 'number') {
          return v.toString();
        }
        return v;
      };
      return `${item.field}: ${formatVal(item.previousValue)} → ${formatVal(item.currentValue)}`;
    }
    return item.details || '';
  }

  public loadMoreHistory() {
    this.historyPagination.pageNumber++;
    this.fetchQuestionHistory(
      this.currentHistoryQuestionId,
      this.historyPagination.pageNumber,
    );
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    switch (fName) {
      case 'Edit':
        this.getByIdQuestion(event);
        break;
      case 'Delete':
        this.deleteQuestion(event.id);
        break;
      case 'History':
        this.viewQuestionHistory(event.id);
        break;
      default:
        break;
    }
  }

  public onRowExpand(id: string): void {
    const questionId = Number(id);
    const question = this.data.data.find((q: any) => q.id === questionId);
    if (!question) return;

    if (question.hasAttachment) {
      this.loadQuestionImage(questionId);
    }

    if (question.options) {
      question.options.forEach((opt: any) => {
        if (opt.hasAttachments) {
          this.loadOptionImage(opt.id);
        }
      });
    }
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
          options: res.options,
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
    this.questionService
      .paginationEntity(`Questionsummary`, payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          // Reset flag after data update to allow future user interactions
          setTimeout(() => {
            this.isUpdatingData = false;
          }, 150);
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res && Array.isArray(res.data)) {
            const transformedData = res.data.map(
              (item: Questionsinterface) => ({
                ...item,
                options: this.transformOptions(item.options),
                isExpanded: false,
                questionUrl: item.file?.url,
              }),
            );
            res.data.forEach((response: any) => {
              if (response.hasAttachment && response.files) {
                // API returns attachment data under 'files' object
                // 'filename' is the field name (not 'name')
                const f = response.files;
                const fileDto: FileDto = {
                  blobId: f.blobId,
                  attachmentType: f.attachmentType,
                  url: f.url,
                  path: f.path,
                  name: f.filename,
                };
                if (fileDto.blobId) {
                  this.questionFileData[response.id] = fileDto;
                }
              }
            });
            this.data = { ...res, data: transformedData };
          }
        },
        error: (error: CustomErrorResponse) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              error.error.type ||
              error.error.message ||
              error.error.errorValue ||
              'error in getting question details',
          });
        },
      });
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
      this.storeService.setIsLoading(false);
      this.isLoading = false;
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
          detail:
            error.error.type ||
            error.error.message ||
            error.error.errorValue ||
            'Creation is failed',
        });
      }
      this.getAllPaginatedQuestion(this.currentPayload);
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
      this.storeService.setIsLoading(false);
      this.isLoading = false;
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
          detail:
            error.error.type ||
            error.error.message ||
            error.error.errorValue ||
            'Updation is failed',
        });
      }
      this.getAllPaginatedQuestion(this.currentPayload);
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
      .pipe(
        finalize(() => {
          this.isLoading = false;
          // Reset flag after data update
          setTimeout(() => {
            this.isUpdatingData = false;
          }, 100);
        }),
      )
      .subscribe((response: any) => {
        const transformedData = response.data.map(
          (item: Questionsinterface) => ({
            ...item,
            options: this.transformOptions(item.options),
            isExpanded: false,
            questionUrl: item.file?.url,
          }),
        );

        response.data.forEach((response: any) => {
          if (response.hasAttachment && response.files) {
            // API returns attachment data under 'files' object
            // 'filename' is the field name (not 'name')
            const f = response.files;
            const fileDto: FileDto = {
              blobId: f.blobId,
              attachmentType: f.attachmentType,
              url: f.url,
              path: f.path,
              name: f.filename,
            };
            if (fileDto.blobId) {
              this.questionFileData[response.id] = fileDto;
            }
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
  private isSamePayload(
    payload1: PaginatedPayload,
    payload2: PaginatedPayload,
  ): boolean {
    return (
      payload1.pagination.pageNumber === payload2.pagination.pageNumber &&
      payload1.pagination.pageSize === payload2.pagination.pageSize &&
      JSON.stringify(payload1.filterMap) ===
        JSON.stringify(payload2.filterMap) &&
      JSON.stringify(payload1.multiSortedColumns) ===
        JSON.stringify(payload2.multiSortedColumns)
    );
  }
}
