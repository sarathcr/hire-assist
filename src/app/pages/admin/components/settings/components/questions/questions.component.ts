/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Toast } from 'primeng/toast';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { OptionsMap } from '../../../../../../shared/models/app-state.models';
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
  OptionsInterface,
  Questionsinterface,
} from '../../../../models/question.model';
import { QuestionService } from '../../../../services/question.service';
import { QuestionFormModalComponent } from './components/question-form-modal/question-form-modal.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionText',
      displayName: 'Question',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'actions',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      actions: [PaginatedDataActions.Edit, PaginatedDataActions.Delete],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: ['question', 'actions'],
  hasExpanded: true,
};
@Component({
  selector: 'app-questions',
  imports: [TableComponent, Toast],
  providers: [TableDataSourceService],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.scss',
})
export class QuestionsComponent implements OnInit {
  public data!: PaginatedData<any>;
  public columns: TableColumnsData = tableColumns;
  public questionFormData = new QuestionForm();
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public optionsMap!: OptionsMap;
  public questionType!: Option[];
  private ref: DynamicDialogRef | undefined;
  public opt!: any;

  constructor(
    private questionService: QuestionService,
    private storeService: StoreService,
    private messageService: MessageService,
    private router: Router,
    public dialog: DialogService,
    private dataSourceService: TableDataSourceService<any>,
  ) {
    this.fGroup = buildFormGroup(this.questionFormData);
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllPaginatedQuestion(new PaginatedPayload());
    this.optionsMap =
      this.storeService.getCollection() as unknown as OptionsMap;
    this.questionType = this.optionsMap['questionType'] as unknown as Option[];
    this.setConfigMaps();
    this.setOptions();
  }

  // Public Methods

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }

  public openAddQuestionModal(): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Create',
    };
    this.ref = this.dialog.open(QuestionFormModalComponent, {
      data: data,
      header: 'Create Question',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        const raw = this.fGroup.value;
        const selectedQuestionTypeLabel =
          this.questionType.find(
            (type: Option) => type.value === raw.questionType,
          )?.label || 'default';
        const transformed = {
          questionText: raw.questionText,
          maxMark: raw.maxmark,
          options: raw.options.map((o: any) => o.options),
          answer: raw.answer,
          active: raw.active,
          hasAttachment: raw.hasAttachments,
          questionType: selectedQuestionTypeLabel,
        };
        this.Createquestion(transformed);
      }
    });
  }

  public deleteQuestion(id: any) {
    const modalData: DialogData = {
      message: 'Are you sure you want to to delete the question?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        // api call to delete the user
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the User Successfully',
          });
          this.getAllPaginatedQuestion(new PaginatedPayload());
        };
        const error = (error: CustomErrorResponse) => {
          const businerssErrorCode = error.error.businessError;
          console.log('errorcode', businerssErrorCode);
          if (businerssErrorCode == 3108) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              // detail: `${error.error.type}`,
              detail:
                'You cannot delete this question because it refers to the Assessment',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Deletion is failed',
            });
          }
          console.log('ERROR', error);
        };
        this.questionService.deleteQuestion(id).subscribe({ next, error });
      }
    });
  }

  public getByIdQuestion(data: number | any) {
    this.questionService.getQuestion(data.id).subscribe({
      next: (res: Questionsinterface) => {
        if (res) {
          console.log('===?', res);
          this.openEditQuestionModal(res);
        }
      },
      error: (error: any) => {
        this.storeService.setIsLoading(false);
        console.log('ERROR', error);
      },
    });
  }
  public openEditQuestionModal(question: Questionsinterface): void {
    const data = {
      fGroup: this.fGroup,
      formData: question,
      configMap: this.configMap,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Update',
    };

    this.ref = this.dialog.open(QuestionFormModalComponent, {
      data: data,
      header: 'Update Question',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        const raw = this.fGroup.value;
        const selectedQuestionTypeLabel =
          this.questionType.find(
            (type: Option) => type.value === raw.questionType,
          )?.label || 'default';
        const transformed = {
          id: question.id,
          questionText: raw.questionText,
          maxMark: raw.maxmark,
          options: raw.options.map((o: any) => o.options),
          answer: raw.answer,
          active: raw.active,
          hasAttachment: raw.hasAttachments,
          questionType: selectedQuestionTypeLabel,
        };

        console.log('updatePAyload', transformed);
        this.Updatequestion(transformed);
      }
    });
  }

  // Private Methods
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/Questionsummary`);
  }

  private getAllPaginatedQuestion(payload: PaginatedPayload) {
    const next = (res: any) => {
      if (res) {
        const transformedData = res.data.map((item: Questionsinterface) => ({
          ...item,
          options: this.transformOptions(item.options),
          isExpanded: false,
        }));

        this.data = { ...res, data: transformedData };
      }
    };

    const error = (error: string) => {
      console.log('error', error);
    };
    this.questionService
      .paginationEntity(`/Questionsummary`, payload)
      .subscribe({ next, error });
  }

  private transformOptions(options: any): OptionsInterface[] {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    this.opt = options.map((option: any) => ({
      options: option.optionText,
      hasAttachments: option.hasAttachment,
      correct: option.isCorrect,
    }));
    return this.opt;
  }

  private Createquestion(payload: Questionsinterface) {
    console.log('pay', payload);
    const next = () => {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Created question Successfully',
        });
      }, 200);

      this.getAllPaginatedQuestion(new PaginatedPayload());
    };
    const error = (error: string) => {
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Creation is failed',
      });
    };
    console.log('payload', payload);

    this.questionService.addQuestion(payload).subscribe({ next, error });
  }

  private Updatequestion(payload: Questionsinterface) {
    console.log('pay', payload);
    const next = () => {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Updated question Successfully',
        });
      }, 200);

      this.getAllPaginatedQuestion(new PaginatedPayload());
    };
    const error = (error: string) => {
      console.log('ERROR', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Updation is failed',
      });
    };
    console.log('payload', payload);

    this.questionService.updateQuestion(payload).subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService.getData(payload).subscribe((response: any) => {
      this.data = response;
    });
  }

  private setConfigMaps(): void {
    const { metadata } = new QuestionForm();
    this.configMap = metadata.configMap || {};
  }

  private setOptions() {
    (this.configMap['questionType'] as CustomSelectConfig).options =
      this.optionsMap['questionType'];
  }
}
