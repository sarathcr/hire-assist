import {
  Component,
  input,
  OnInit,
  computed,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
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
import { InterviewService } from '../../../../services/interview.service';
import { FileDto } from '../../../../../../models/question.model';

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
  searchValue?: string;
  previousIsLoading?: boolean;
  currentPayload?: PaginatedPayload;
  previousFilterMap?: any;
  previewImageUrls?: Record<number, string[]>;
  isImageLoadings?: Record<number, boolean>;
  questionFileData?: Record<number, FileDto>;
  optionFileData?: Record<number, FileDto>;
  selectionResetCounter?: number;
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
    private readonly cdr: ChangeDetectorRef,
    private readonly interviewService: InterviewService,
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

    // Store the original state before making changes
    const originalAllSelectedQuestions = [...accordionData.allSelectedQuestions];
    const originalSelectedIds = [...(accordionData.selectedIds || [])];

    const selectedIds = newIds.map((item) => item.id.toString());
    const currentPageIdsSet = new Set(
      (accordionData.tabledata?.data || []).map((q) => q.id.toString()),
    );

    // Calculate new selection without modifying accordionData yet
    const allSelectedQuestionsExcludingCurrentPage =
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
      ...allSelectedQuestionsExcludingCurrentPage,
      ...selectedOnPage,
    ];

    const uniqueQuestionsMap = new Map<number, QuestionsSetQuesions>();
    combinedQuestions.forEach((q) => {
      uniqueQuestionsMap.set(q.questionId, q);
    });

    const newAllSelectedQuestions = Array.from(uniqueQuestionsMap.values());

    // Calculate total score for the new selection
    const newTotalScore = newAllSelectedQuestions.reduce(
      (sum, q) => sum + (q.maxMark || 0),
      0,
    );

    // Validate total score doesn't exceed 200 BEFORE modifying accordionData
    const maxScore = this.getKnobMaxValue();
    if (newTotalScore > maxScore) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Total score cannot exceed ${maxScore}. Current selection would result in ${newTotalScore} marks.`,
      });
      // Restore original state
      accordionData.allSelectedQuestions = [...originalAllSelectedQuestions];
      accordionData.selectedIds = [];
      
      // Temporarily clear selectedIds to force table reset
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      this.cdr.markForCheck();
      
      // Then restore the original selectedIds to sync the table
      setTimeout(() => {
        accordionData.selectedIds = [...originalSelectedIds];
        this.questionSetAccordionData.set(questionSetId, { ...accordionData });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 0);
      return;
    }

    // Only update accordionData if validation passes
    accordionData.allSelectedQuestions = newAllSelectedQuestions;

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
      // Update disabled state of questions after selection change
      this.updateQuestionDisabledStates(questionSetId);
      this.questionSetAccordionData.set(questionSetId, {
        ...updatedAccordionData,
      });
      this.cdr.markForCheck();
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private updateQuestionDisabledStates(questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData || !accordionData.tabledata) {
      return;
    }

    // Calculate current total score
    const currentTotalScore =
      accordionData.allSelectedQuestions.reduce(
        (sum, q) => sum + (q.maxMark || 0),
        0,
      ) || 0;
    const maxScore = this.getKnobMaxValue();

    // Update disabled state for each question in the table
    const updatedData = accordionData.tabledata.data.map((item: any) => {
      // Check if selecting this question would exceed the max score
      const wouldExceedMax =
        currentTotalScore + (item.maxMark || 0) > maxScore;
      // Only disable if it's not already selected
      const isAlreadySelected = accordionData.selectedIds?.includes(
        item.id.toString(),
      );
      const isDisabled = wouldExceedMax && !isAlreadySelected;

      return {
        ...item,
        isDisabled: isDisabled,
      };
    });

    // Create new reference to trigger change detection
    accordionData.tabledata = {
      ...accordionData.tabledata,
      data: updatedData,
    };
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
            searchValue: '',
            previousIsLoading: false,
            currentPayload: new PaginatedPayload(),
            previousFilterMap: {},
            previewImageUrls: {},
            isImageLoadings: {},
            questionFileData: {},
            optionFileData: {},
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
            existingData.searchValue = existingData.searchValue || '';
            existingData.previousIsLoading = false;
            if (!existingData.currentPayload) {
              existingData.currentPayload = new PaginatedPayload();
            }
            if (!existingData.previousFilterMap) {
              existingData.previousFilterMap = {};
            }
            this.questionSetAccordionData.set(qs.id.toString(), {
              ...existingData,
            });
          }
        }
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
    payload.pagination.pageSize = -1;
    this.assessmentService
      .paginationEntity<QuestionSetModel>('QuestionSetSummary', payload)
      .subscribe({ next, error });
  }

  private transformOptions(
    options: OptionsForQuestionSetInterface[] | any[],
    questionSetId?: string,
  ): OptionsForQuestionSetInterface[] {
    if (!options || !Array.isArray(options)) {
      return [];
    }

    this.opt = options.map((option: any) => ({
      optionText: option.optionText,
      hasAttachments: option.hasAttachments || option.hasAttachment || option.optionHasAttachment || false,
      isCorrect: option.isCorrect,
      id: option.id || option.optionId,
      blobId: option.blobId || option.optionBlobId,
      attachmentType: option.attachmentType || option.optionsAttachmentTypeId,
      name: option.name || option.optionFileName,
      path: option.path || option.optionPath,
      url: option.url || option.optionFileUrl,
    }));

    // Store option file data for lazy loading if questionSetId is provided
    if (questionSetId) {
      const accordionData = this.questionSetAccordionData.get(questionSetId);
      if (accordionData) {
        if (!accordionData.optionFileData) {
          accordionData.optionFileData = {};
        }
        this.opt.forEach((opt: any) => {
          if (opt.hasAttachments && opt.blobId) {
            const file: FileDto = {
              blobId: opt.blobId,
              attachmentType: opt.attachmentType,
              name: opt.name,
              path: opt.path,
              url: opt.url,
            };
            accordionData.optionFileData![opt.id] = file;
          }
        });
        // Update the Map to ensure changes are persisted
        this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      }
    }

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
    this.cdr.markForCheck();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
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
        // Clear previous image data when loading new data
        accordionData.previewImageUrls = {};
        accordionData.isImageLoadings = {};
        accordionData.questionFileData = {};
        accordionData.optionFileData = {};

        // Store file data for lazy loading
        res.data.forEach((response: any) => {
          if (response.hasAttachment && response.files) {
            // Store file data for lazy loading, don't load image yet
            accordionData.questionFileData![Number(response.id)] =
              response.files;
          }
        });

        // Calculate current total score
        const currentTotalScore =
          accordionData.allSelectedQuestions.reduce(
            (sum, q) => sum + (q.maxMark || 0),
            0,
          ) || 0;
        const maxScore = this.getKnobMaxValue();

        const transformedData = res.data.map((item: QuestionsModel) => {
          // Check if selecting this question would exceed the max score
          const wouldExceedMax =
            currentTotalScore + (item.maxMark || 0) > maxScore;
          // Only disable if it's not already selected
          const isAlreadySelected = accordionData.selectedIds?.includes(
            item.id.toString(),
          );
          const isDisabled = wouldExceedMax && !isAlreadySelected;

          return {
            ...item,
            options: this.transformOptions(item.options, questionSetId),
            isExpanded: false,
            isDisabled: isDisabled,
          };
        });
        accordionData.tabledata = {
          ...res,
          data: transformedData,
        };
        accordionData.hasLoadedTableData = true;
      }
      accordionData.isLoadingQuestions = false;
      accordionData.previousIsLoading = accordionData.isLoadingQuestions;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });

      if (accordionData.searchValue) {
        setTimeout(() => {
          this.restoreSearchValueOnly(questionSetId);
        }, 200);
      }
    };

    const error = (err: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error.type,
      });
      accordionData.isLoadingQuestions = false;
      accordionData.hasLoadedTableData = true;
      accordionData.previousIsLoading = false;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
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

    if (accordionData) {
      const isSearch =
        JSON.stringify(payload.filterMap) !==
        JSON.stringify(accordionData.previousFilterMap || {});

      if (isSearch) {
        payload.pagination.pageNumber = 1;
      }

      if (
        !payload.multiSortedColumns ||
        !Array.isArray(payload.multiSortedColumns)
      ) {
        payload.multiSortedColumns = [];
      }

      accordionData.previousFilterMap = JSON.parse(
        JSON.stringify(payload.filterMap || {}),
      );
      accordionData.currentPayload = payload;
      accordionData.searchValue =
        (payload.filterMap?.['searchKey'] as string) || '';
      accordionData.previousIsLoading = accordionData.isLoadingQuestions;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
    }

    if (
      payload &&
      (!payload.multiSortedColumns ||
        !Array.isArray(payload.multiSortedColumns))
    ) {
      payload.multiSortedColumns = [];
    }

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

  private restoreSearchValueOnly(questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData?.searchValue) {
      return;
    }

    try {
      const questionSetIndex = this.questionSets.findIndex(
        (qs) => qs.id.toString() === questionSetId,
      );
      if (questionSetIndex === -1) {
        return;
      }

      const accordionPanels = document.querySelectorAll('p-accordion-panel');
      if (questionSetIndex >= accordionPanels.length) {
        return;
      }

      const accordionPanel = accordionPanels[questionSetIndex];
      const tableContainer = accordionPanel.querySelector(
        '.QuestionSet__table-container',
      ) as HTMLElement;
      if (!tableContainer) {
        return;
      }

      const searchInput = tableContainer.querySelector(
        'input[type="text"][placeholder="Search keyword"]',
      ) as HTMLInputElement;
      if (searchInput && searchInput.value !== accordionData.searchValue) {
        (searchInput as any).__isRestoring = true;
        searchInput.value = accordionData.searchValue;
        setTimeout(() => {
          (searchInput as any).__isRestoring = false;
        }, 100);
      }
    } catch (error) {
      // Silently handle restore failure
    }
  }

  public getKnobMaxValue(): number {
    return 200;
  }

  public previewImage(file: FileDto, id: number, questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    if (!accordionData.isImageLoadings) {
      accordionData.isImageLoadings = {};
    }
    if (!accordionData.previewImageUrls) {
      accordionData.previewImageUrls = {};
    }

    accordionData.isImageLoadings[id] = true;
    this.questionSetAccordionData.set(questionSetId, { ...accordionData });

    this.interviewService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          const imageUrl = URL.createObjectURL(blob);
          if (!accordionData.previewImageUrls![id]) {
            accordionData.previewImageUrls![id] = [];
          }
          accordionData.previewImageUrls![id].push(imageUrl);
          setTimeout(() => {
            if (accordionData.isImageLoadings) {
              accordionData.isImageLoadings[id] = false;
            }
            this.questionSetAccordionData.set(questionSetId, {
              ...accordionData,
            });
            this.cdr.markForCheck();
          }, 300);
        },
        error: () => {
          if (accordionData.isImageLoadings) {
            accordionData.isImageLoadings[id] = false;
          }
          this.questionSetAccordionData.set(questionSetId, {
            ...accordionData,
          });
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load image',
          });
        },
      });
  }

  public loadQuestionImage(id: number, questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    if (
      accordionData.questionFileData?.[id] &&
      !accordionData.previewImageUrls?.[id]
    ) {
      if (!accordionData.isImageLoadings) {
        accordionData.isImageLoadings = {};
      }
      accordionData.isImageLoadings[id] = true;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      this.previewImage(accordionData.questionFileData[id], id, questionSetId);
    }
  }

  public loadOptionImage(id: number, questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    if (
      accordionData.optionFileData?.[id] &&
      !accordionData.previewImageUrls?.[id]
    ) {
      if (!accordionData.isImageLoadings) {
        accordionData.isImageLoadings = {};
      }
      accordionData.isImageLoadings[id] = true;
      this.questionSetAccordionData.set(questionSetId, { ...accordionData });
      this.previewImage(accordionData.optionFileData[id], id, questionSetId);
    }
  }

  public getLoadQuestionImageHandler(
    questionSetId: string,
  ): (id: number) => void {
    return (id: number) => this.loadQuestionImage(id, questionSetId);
  }

  public getLoadOptionImageHandler(
    questionSetId: string,
  ): (id: number) => void {
    return (id: number) => this.loadOptionImage(id, questionSetId);
  }
}
