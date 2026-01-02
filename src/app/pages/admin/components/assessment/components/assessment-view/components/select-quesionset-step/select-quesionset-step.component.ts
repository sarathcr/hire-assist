import { Component, input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AccordionModule, AccordionTabOpenEvent } from 'primeng/accordion';
import { DialogService } from 'primeng/dynamicdialog';
import { Knob } from 'primeng/knob';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { ASSESSMENT_URL } from '../../../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../../../shared/models/pagination.models';
import { TableColumnsData } from '../../../../../../../../shared/models/table.models';
import {
  buildFormGroup,
  ConfigMap,
  CustomSelectConfig,
  Metadata,
} from '../../../../../../../../shared/utilities/form.utility';
import {
  QuestionSetForm,
  QuestionSetFormModal,
} from '../../../../../../models/assessment-schedule.model';
import {
  GetSelectedQuestionsForSet,
  OptionsForQuestionSetInterface,
  QuestionSetModel,
  QuestionsModel,
  QuestionsSetQuesions,
  SelectQuestionsAndSetModel,
} from '../../../../../../models/question.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { QuestionService } from '../../../../../../services/question.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { QuestionSetModalComponent } from './question-set-modal/question-set-modal.component';
import { QuestionSetStepSkeletonComponent } from './questionSet-skeleton';
import { StepsStatusService } from '../../../../services/steps-status.service';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionText',
      displayName: 'Question',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'questionType',
      displayName: 'QuestionType',
      sortedColumn: true,
      hasChip: false,
    },
    {
      field: 'maxMark',
      displayName: 'Max-Mark',
      sortedColumn: true,
      hasChip: false,
    },
  ],
  displayedColumns: ['question'],
  hasExpanded: true,
};
interface GroupedQuestions {
  type: string;
  questions: QuestionsSetQuesions[];
  count: number;
  totalMarks: number;
}
interface QuestionSetAccordionData {
  questionSet: QuestionSetModel;
  selectedIds: string[];
  allSelectedQuestions: QuestionsSetQuesions[];
  groupedSelectedData: GroupedQuestions[];
  totalScore: number;
  isUpdate: boolean;
  tabledata?: PaginatedData<QuestionsModel>;
  isLoadingQuestions: boolean;
  isLoadingSelectedQuestions: boolean;
  hasLoadedSelectedQuestions: boolean;
  hasLoadedTableData: boolean;
}
@Component({
  selector: 'app-select-quesionset-step',
  imports: [
    ButtonComponent,
    ReactiveFormsModule,
    ToastModule,
    TableComponent,
    QuestionSetStepSkeletonComponent,
    TableModule,
    Knob,
    FormsModule,
    AccordionModule,
    SkeletonModule,
  ],
  templateUrl: './select-quesionset-step.component.html',
  styleUrl: './select-quesionset-step.component.scss',
  providers: [
    {
      provide: TableDataSourceService,
      useFactory: (http: HttpClient) => {
        return new TableDataSourceService<QuestionsModel>(http);
      },
      deps: [HttpClient],
    },
  ],
})
export class SelectQuesionsetStepComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentId = input<number>();

  public data!: QuestionSetForm;
  public metadata!: Metadata[];
  public isEdit = false;
  public questionSetFGroup!: FormGroup;
  public configMap!: ConfigMap;
  public questionSetModal = new QuestionSetFormModal();
  public fGroup!: FormGroup;
  public questionSets: QuestionSetModel[] = [];
  public opt!: OptionsForQuestionSetInterface[];
  public tabledata!: PaginatedData<QuestionsModel>;
  public columns: TableColumnsData = tableColumns;
  public selectedIds: string[] = [];
  public questionSetSubmittedData!: SelectQuestionsAndSetModel | undefined;
  public groupedSelectedData: GroupedQuestions[] = [];
  public grouped: Record<string, GroupedQuestions> = {};
  public totalScore = 0;
  public questiondata!: GetSelectedQuestionsForSet;
  public allSelectedQuestions: QuestionsSetQuesions[] = [];
  public isUpdate = false;
  public selectedData!: QuestionsModel[];
  public isLoading = false;
  public questionSetAccordionData = new Map<string, QuestionSetAccordionData>();
  public currentSelectedQuestionSetId: string | null = null;

  constructor(
    private readonly questionSetStateService: QuestionSetStateService,
    private readonly messageService: MessageService,
    private readonly assessmentService: AssessmentService,
    public dialog: DialogService,
    private readonly dataSourceService: TableDataSourceService<QuestionsModel>,
    private readonly questionService: QuestionService,
    private readonly stepsStatusService: StepsStatusService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.questionSetModal);
  }

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.setConfigMaps();
    this.getAllQuestionSets(new PaginatedPayload());
  }
  public onUpdateQuestionSet(): void {
    const selectedId = this.fGroup.get('questionSet')?.value;
    const selectedSet = this.questionSets.find(
      (qs: QuestionSetModel) => qs.id.toString() === selectedId,
    );

    if (!selectedSet) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No valid question set selected for update.',
      });
      return;
    }

    const data = {
      configMap: this.configMap || {},
      formData: {
        id: selectedSet.id,
        title: selectedSet.title,
        description: selectedSet.description || '',
        assessmentId: Number(this.assessmentId()),
      },
    };

    const childRef = this.dialog.open(QuestionSetModalComponent, {
      data: data,
      header: 'Update Question Set',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    childRef.onClose.subscribe();
  }

  public onSelectedIds(newIds: QuestionsModel[], questionSetId: string) {
    if (!questionSetId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a Question Set before choosing questions.',
      });
      return;
    }

    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    const selectedIds = newIds.map((item) => item.id.toString());
    const currentPageIdsSet = new Set(
      (accordionData.tabledata?.data || []).map((q) => q.id.toString()),
    );

    accordionData.allSelectedQuestions =
      accordionData.allSelectedQuestions.filter(
        (q) => !currentPageIdsSet.has(q.questionId.toString()),
      );

    const selectedIdsSet = new Set(selectedIds);
    const selectedOnPage = (accordionData.tabledata?.data || [])
      .filter((q) => selectedIdsSet.has(q.id.toString()))
      .map((q) => ({
        questionId: Number(q.id),
        questionType: q.questionType || 'Unknown',
        maxMark: q.maxMark || 0,
      }));

    const combinedQuestions = [
      ...accordionData.allSelectedQuestions,
      ...selectedOnPage,
    ];

    const uniqueQuestionsMap = new Map<number, QuestionsSetQuesions>();
    combinedQuestions.forEach((q) => {
      uniqueQuestionsMap.set(q.questionId, q);
    });

    accordionData.allSelectedQuestions = Array.from(
      uniqueQuestionsMap.values(),
    );

    accordionData.selectedIds = accordionData.allSelectedQuestions.map((q) =>
      q.questionId.toString(),
    );

    const selectedQuestions: GetSelectedQuestionsForSet = {
      questionSetId: questionSetId,
      questions: accordionData.allSelectedQuestions,
    };

    this.groupQuestionSetForAccordion(selectedQuestions, questionSetId);

    const updatedAccordionData =
      this.questionSetAccordionData.get(questionSetId);
    if (updatedAccordionData) {
      this.questionSetAccordionData.set(questionSetId, {
        ...updatedAccordionData,
      });
    }
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }
  public onSubmit(questionSetId: string) {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: questionSetId,
      questionIds: accordionData.selectedIds,
    };
    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Questions and set are saved Successfully',
      });
      accordionData.isUpdate = true;
      accordionData.hasLoadedSelectedQuestions = false;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      this.loadQuestionsForAccordion(questionSetId);
    };

    const error = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Questions and set save failed',
      });
    };
    this.assessmentService
      .createEntity(this.questionSetSubmittedData, 'questionsetquestions')
      .subscribe({ next, error });
  }

  public onUpdate(questionSetId: string) {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: questionSetId,
      questionIds: accordionData.selectedIds,
    };
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Questions and set are updated Successfully',
      });
      this.isLoading = false;
      accordionData.hasLoadedSelectedQuestions = false;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      this.loadQuestionsForAccordion(questionSetId);
    };
    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
      this.isLoading = false;
    };
    this.assessmentService
      .updateEntity('', this.questionSetSubmittedData, 'questionsetquestions')
      .subscribe({ next, error });
  }
  public onCreateQuestionSet() {
    const data = {
      assessmentId: Number(this.assessmentId()),
    };

    const childRef = this.dialog.open(QuestionSetModalComponent, {
      data: data,
      header: 'Create Question Set',
      width: '30vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    childRef.onClose.subscribe(
      (result: { isCreateSuccess?: boolean } | undefined) => {
        if (result?.isCreateSuccess !== false) {
          this.getAllQuestionSets(new PaginatedPayload());
        }
      },
    );
  }

  private setConfigMaps(): void {
    const { metadata } = new QuestionSetFormModal();
    this.configMap = metadata.configMap || {};
  }
  private setOptions() {
    const updatedQuestions = this.questionSets?.map(
      (ques: QuestionSetModel) => ({
        label: ques.title,
        value: ques.id.toString(),
      }),
    );

    this.configMap = {
      ...this.configMap,
      questionSet: {
        ...(this.configMap['questionSet'] as CustomSelectConfig),
        options: updatedQuestions,
      },
    };
  }
  private getAllQuestionSets(payload: PaginatedPayload): void {
    this.isLoading = true;
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };

    const next = (res: PaginatedData<QuestionSetModel>) => {
      this.questionSets = res.data;
      res.data.forEach((qs) => {
        if (!this.questionSetAccordionData.has(qs.id.toString())) {
          this.questionSetAccordionData.set(qs.id.toString(), {
            questionSet: qs,
            selectedIds: [],
            allSelectedQuestions: [],
            groupedSelectedData: [],
            totalScore: 0,
            isUpdate: false,
            isLoadingQuestions: false,
            isLoadingSelectedQuestions: false,
            hasLoadedSelectedQuestions: false,
            hasLoadedTableData: false,
          });
        } else {
          const existingData = this.questionSetAccordionData.get(
            qs.id.toString(),
          );
          if (existingData) {
            existingData.allSelectedQuestions = [];
            existingData.selectedIds = [];
            existingData.groupedSelectedData = [];
            existingData.totalScore = 0;
            existingData.hasLoadedSelectedQuestions = false;
            existingData.hasLoadedTableData = false;
            this.questionSetAccordionData.set(qs.id.toString(), {
              ...existingData,
            });
          }
        }
        this.loadQuestionsForAccordion(qs.id.toString());
      });
      this.setOptions();
      this.isLoading = false;
    };

    const error = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'error in getting question set details',
      });
    };

    this.assessmentService
      .paginationEntity<QuestionSetModel>('QuestionSetSummary', payload)
      .subscribe({ next, error });
  }

  private transformOptions(
    options: OptionsForQuestionSetInterface[],
  ): OptionsForQuestionSetInterface[] {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    this.opt = options.map((option: OptionsForQuestionSetInterface) => ({
      optionText: option.optionText,
      hasAttachments: option.hasAttachments,
      isCorrect: option.isCorrect,
    }));
    return this.opt;
  }

  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/Questionsummary`);
  }

  private loadData(payload: PaginatedPayload): void {
    this.dataSourceService
      .getData(payload)
      .subscribe((response: PaginatedData<QuestionsModel>) => {
        this.tabledata = response;
      });
  }

  private getAllPaginatedQuestion(payload: PaginatedPayload) {
    this.isLoading = true;
    const next = (res: PaginatedData<QuestionsModel>) => {
      if (res) {
        const transformedData = res.data.map((item: QuestionsModel) => ({
          ...item,
          options: this.transformOptions(item.options),
          isExpanded: false,
        }));
        this.tabledata = { ...res, data: transformedData };
        this.isLoading = false;
      }
    };

    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
      this.isLoading = false;
    };

    this.questionService
      .paginationEntity<QuestionsModel>(`Questionsummary`, payload)
      .subscribe({ next, error });
  }

  public groupQuestionSet(questionsset: GetSelectedQuestionsForSet) {
    this.grouped = questionsset.questions.reduce(
      (acc: Record<string, GroupedQuestions>, item) => {
        const type = item.questionType || 'Unknown';
        if (!acc[type]) {
          acc[type] = { type, questions: [], count: 0, totalMarks: 0 };
        }
        acc[type].questions.push(item);
        acc[type].count += 1;
        acc[type].totalMarks += item.maxMark || 0;
        return acc;
      },
      {},
    );
    this.groupedSelectedData = Object.values(this.grouped);
    this.totalScore = this.groupedSelectedData.reduce(
      (sum, group) => sum + group.totalMarks,
      0,
    );
  }

  private groupQuestionSetForAccordion(
    questionsset: GetSelectedQuestionsForSet,
    questionSetId: string,
  ) {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    if (!questionsset.questions || questionsset.questions.length === 0) {
      accordionData.groupedSelectedData = [];
      accordionData.totalScore = 0;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      return;
    }

    const grouped = questionsset.questions.reduce(
      (acc: Record<string, GroupedQuestions>, item) => {
        const type =
          (item.questionType && item.questionType.trim()) || 'Unknown';
        const maxMark = item.maxMark || 0;

        if (!acc[type]) {
          acc[type] = { type, questions: [], count: 0, totalMarks: 0 };
        }
        acc[type].questions.push(item);
        acc[type].count += 1;
        acc[type].totalMarks += maxMark;
        return acc;
      },
      {},
    );
    const groupedArray = Object.values(grouped);
    const totalScore = groupedArray.reduce(
      (sum, group) => sum + group.totalMarks,
      0,
    );

    const updatedData: QuestionSetAccordionData = {
      ...accordionData,
      groupedSelectedData: [...groupedArray],
      totalScore: totalScore,
      allSelectedQuestions: [...accordionData.allSelectedQuestions],
      selectedIds: [...accordionData.selectedIds],
    };

    this.questionSetAccordionData.set(questionSetId, updatedData);
  }

  public onAccordionOpen(event: AccordionTabOpenEvent): void {
    const questionSetId = event.index?.toString() || '';

    if (!questionSetId) {
      return;
    }

    const questionSet = this.questionSets.find(
      (qs) => qs.id.toString() === questionSetId,
    );

    if (questionSet) {
      this.currentSelectedQuestionSetId = questionSetId;
      const accordionData = this.questionSetAccordionData.get(questionSetId);

      if (!accordionData) {
        return;
      }

      if (!accordionData.tabledata) {
        accordionData.tabledata = {
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0,
          totalRecords: 0,
          data: [],
          succeeded: true,
          errors: [],
          message: '',
        };
      }

      if (!accordionData.hasLoadedSelectedQuestions) {
        this.loadQuestionsForAccordion(questionSetId, () => {
          if (!accordionData.hasLoadedTableData) {
            const initialPayload = new PaginatedPayload();
            initialPayload.pagination.pageNumber = 1;
            initialPayload.pagination.pageSize = 10;
            this.getAllPaginatedQuestionForAccordion(
              initialPayload,
              questionSetId,
            );
          }
        });
      } else {
        if (accordionData.hasLoadedTableData) {
          return;
        }
        const initialPayload = new PaginatedPayload();
        initialPayload.pagination.pageNumber = 1;
        initialPayload.pagination.pageSize = 10;
        this.getAllPaginatedQuestionForAccordion(initialPayload, questionSetId);
      }
    }
  }

  private loadQuestionsForAccordion(
    questionSetId: string,
    onComplete?: () => void,
  ): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData || accordionData.hasLoadedSelectedQuestions) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    accordionData.isLoadingSelectedQuestions = true;
    this.questionSetAccordionData.set(questionSetId, { ...accordionData });

    this.assessmentService.getQuestionsBySet(questionSetId).subscribe({
      next: (res: GetSelectedQuestionsForSet) => {
        const serverQuestions = res.questions || [];
        const uniqueQuestionsMap = new Map<number, QuestionsSetQuesions>();
        serverQuestions.forEach((q) => {
          uniqueQuestionsMap.set(q.questionId, q);
        });
        accordionData.allSelectedQuestions = Array.from(
          uniqueQuestionsMap.values(),
        );
        accordionData.selectedIds = accordionData.allSelectedQuestions.map(
          (item: QuestionsSetQuesions) => item.questionId.toString(),
        );

        this.questionSetAccordionData.set(questionSetId, { ...accordionData });

        if (accordionData.selectedIds.length > 0) {
          accordionData.isUpdate = true;
        }
        const deduplicatedResponse: GetSelectedQuestionsForSet = {
          questionSetId: res.questionSetId,
          questions: accordionData.allSelectedQuestions,
        };
        this.groupQuestionSetForAccordion(deduplicatedResponse, questionSetId);

        const updatedAccordionData =
          this.questionSetAccordionData.get(questionSetId);
        if (updatedAccordionData) {
          updatedAccordionData.hasLoadedSelectedQuestions = true;
          updatedAccordionData.isLoadingSelectedQuestions = false;
          this.questionSetAccordionData.set(questionSetId, {
            ...updatedAccordionData,
          });
        }
        if (onComplete) {
          onComplete();
        }
      },
      error: (error: CustomErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.type,
        });
        accordionData.hasLoadedSelectedQuestions = true;
        accordionData.isLoadingSelectedQuestions = false;
        this.questionSetAccordionData.set(questionSetId, { ...accordionData });
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  private getAllPaginatedQuestionForAccordion(
    payload: PaginatedPayload,
    questionSetId: string,
  ): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    accordionData.isLoadingQuestions = true;

    const next = (res: PaginatedData<QuestionsModel>) => {
      if (res) {
        const transformedData = res.data.map((item: QuestionsModel) => ({
          ...item,
          options: this.transformOptions(item.options),
          isExpanded: false,
        }));
        accordionData.tabledata = {
          ...res,
          data: transformedData,
        };
        accordionData.hasLoadedTableData = true;
      }
      accordionData.isLoadingQuestions = false;
    };

    const error = (err: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error.type,
      });
      accordionData.isLoadingQuestions = false;
      accordionData.hasLoadedTableData = true;
    };

    this.questionService
      .paginationEntity<QuestionsModel>(`Questionsummary`, payload)
      .subscribe({ next, error });
  }

  public onTablePayloadChangeForAccordion(
    payload: PaginatedPayload,
    questionSetId: string,
  ): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);

    if (accordionData && !accordionData.hasLoadedTableData) {
      this.getAllPaginatedQuestionForAccordion(payload, questionSetId);
    } else if (accordionData && accordionData.hasLoadedTableData) {
      this.getAllPaginatedQuestionForAccordion(payload, questionSetId);
    }
  }

  public onCompleteQuestionSetStep(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.isLoading = true;
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          this.isLoading = false;
          this.stepsStatusService.notifyStepCompleted(assessmentId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question Set step completed successfully',
          });
        },
        error: () => {
          this.isLoading = false;
          this.stepsStatusService.notifyStepCompleted(assessmentId);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question Set step completed successfully',
          });
        },
      });
    }
  }

  public hasSubmittedQuestionSets(): boolean {
    for (const accordionData of this.questionSetAccordionData.values()) {
      if (accordionData.isUpdate) {
        return true;
      }
    }
    return false;
  }
}
