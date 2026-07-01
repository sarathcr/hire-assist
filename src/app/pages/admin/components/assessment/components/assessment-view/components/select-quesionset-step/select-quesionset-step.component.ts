import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  input,
  OnInit
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Knob } from 'primeng/knob';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { HistoryDrawerComponent } from '../../../../../../../../shared/components/history-drawer/history-drawer.component';
import { ASSESSMENT_URL } from '../../../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../../../shared/models/table.models';
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
  FileDto,
  GetSelectedQuestionsForSet,
  OptionsForQuestionSetInterface,
  QuestionSetModel,
  QuestionsModel,
  QuestionsSetQuesions,
  SelectQuestionsAndSetModel,
} from '../../../../../../models/question.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { QuestionService } from '../../../../../../services/question.service';
import { InterviewService } from '../../../../services/interview.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { QuestionSetModalComponent } from './question-set-modal/question-set-modal.component';
import { QuestionSetStepSkeletonComponent } from './questionSet-skeleton';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionText',
      displayName: 'Question',
      sortedColumn: true,
      hasChip: false,
      width: 6,
    },
    {
      field: 'questionType',
      displayName: 'Question Type',
      sortedColumn: true,
      hasChip: false,
      width: 2,
    },
    {
      field: 'maxMark',
      displayName: 'Max-Mark',
      sortedColumn: true,
      hasChip: false,
      width: 1,
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: ['pi pi-history'],
      buttonLabels: ['History'],
      buttonTooltips: ['History'],
      sortedColumn: false,
      hasChip: false,
      width: 1,
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
  originalSelectedIds?: string[];
}
@Component({
  selector: 'app-select-quesionset-step',
  imports: [
    ButtonComponent,
    ReactiveFormsModule,

    TableComponent,
    QuestionSetStepSkeletonComponent,
    TableModule,
    Knob,
    FormsModule,
    AccordionModule,
    SkeletonModule,
    HistoryDrawerComponent,
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
  public isReadOnly = input<boolean>(false);
  public stepStatus = input<string>('Pending');
  public isIncomplete = input<boolean>(false);
  public isParentLoading = input<boolean>(true);
  public hasModifiedAfterComplete = input<boolean>(false);

  private hasLocalModifications = false;

  public data!: QuestionSetForm;
  public metadata!: Metadata[];
  public isEdit = false;
  public questionSetFGroup!: FormGroup;
  public configMap!: ConfigMap;
  public questionSetModal = new QuestionSetFormModal();
  public fGroup!: FormGroup;
  public questionSets: QuestionSetModel[] = [];
  public assessmentRounds: QuestionSetModel[] = [];
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
  public visible: boolean = false;
  events = [
    {
      status: 'Created',
      user: 'Sarath Cheerakkadan',
      date: '2025-10-15T10:30:00',
      icon: 'pi pi-plus',
    },
    {
      status: 'Updated',
      user: 'Sarath Cheerakkadan',
      date: '2025-10-15T14:00:00',
      icon: 'pi pi-pencil',
    },
    {
      status: 'Updated',
      user: 'Steve Jose',
      date: '2025-10-15T16:15:00',
      icon: 'pi pi-pencil',
    },
    {
      status: 'Updated',
      user: 'Lakshmipriya',
      date: '2025-10-16T10:00:00',
      icon: 'pi pi-pencil',
    },
  ];

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

  public onEditQuestionSet(questionSet: QuestionSetModel): void {
    const data = {
      configMap: this.configMap || {},
      formData: {
        id: questionSet.id,
        title: questionSet.title,
        description: questionSet.description || '',
        assessmentId: Number(this.assessmentId()),
        assessmentRoundId: questionSet.assessmentRoundId || 0,
      },
    };

    const childRef = this.dialog.open(QuestionSetModalComponent, {
      data: data,
      header: 'Update Question Set',
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
  public onDeleteQuestionSet(questionSet: QuestionSetModel): void {
    const modalData: DialogData = {
      message: `Are you sure you want to delete the question set "${questionSet.title}"?`,
      isChoice: true,
      closeOnNavigation: true,
      acceptButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    };

    const ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
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

    ref.onClose.subscribe((res: boolean) => {
      if (res) {
        this.deleteQuestionSet(questionSet.id);
      }
    });
  }

  private deleteQuestionSet(id: number): void {
    this.isLoading = true;
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted Question Set Successfully',
      });
      this.getAllQuestionSets(new PaginatedPayload());
      this.isLoading = false;
    };
    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
      this.isLoading = false;
    };

    this.assessmentService
      .deleteQuestionSet(id, Number(this.assessmentId()))
      .subscribe({
        next: () => {
          next();
          this.stepsStatusService.notifyStepStatusUpdate(Number(this.assessmentId()));
        },
        error,
      });
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

  public viewHistory(id: any) {
    this.visible = true;
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    switch (fName) {
      case 'History':
        this.viewHistory(event.id);
        break;
      default:
        break;
    }
  }

  public isDirtyForAccordion(questionSetId: string): boolean {
    const data = this.questionSetAccordionData.get(questionSetId);
    if (!data || !data.originalSelectedIds) return false;

    if (data.selectedIds.length !== data.originalSelectedIds.length) return true;

    const current = [...data.selectedIds].sort();
    const original = [...data.originalSelectedIds].sort();

    return current.some((id, index) => id !== original[index]);
  }

  public onSubmit(questionSetId: string) {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: accordionData.questionSet.id.toString(),
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
      accordionData.originalSelectedIds = [...accordionData.selectedIds];
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
      .subscribe({
        next: () => {
          next();
          this.stepsStatusService.notifyStepStatusUpdate(Number(this.assessmentId()));
        },
        error,
      });
  }

  public onUpdate(questionSetId: string) {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData) {
      return;
    }

    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: accordionData.questionSet.id.toString(),
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
      accordionData.originalSelectedIds = [...accordionData.selectedIds];
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
      .subscribe({
        next: () => {
          next();
          this.stepsStatusService.notifyStepStatusUpdate(Number(this.assessmentId()));
        },
        error,
      });
  }
  public onCreateQuestionSet(assessmentRoundId?: number) {
    const data = {
      assessmentId: Number(this.assessmentId()),
      assessmentRoundId: assessmentRoundId
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
          this.hasLocalModifications = true;
          this.getAllQuestionSets(new PaginatedPayload());
          this.stepsStatusService.notifyStepStatusUpdate(Number(this.assessmentId()));
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

      // Extract unique rounds
      const roundsMap = new Map<number, QuestionSetModel>();
      res.data.forEach((qs) => {
        const roundId = qs.assessmentRoundId || 0;
        if (!roundsMap.has(roundId)) {
          roundsMap.set(roundId, qs);
        }
      });
      this.assessmentRounds = Array.from(roundsMap.values()).sort((a, b) => {
        return (a.assessmentRoundId || 0) - (b.assessmentRoundId || 0);
      });

      const activeIds = new Set(res.data.map((qs) => qs.id.toString()));
      for (const id of this.questionSetAccordionData.keys()) {
        if (!activeIds.has(id)) {
          this.questionSetAccordionData.delete(id);
        }
      }

      res.data.forEach((qs) => {
        if (qs.id === 0) return;

        const setId = qs.id.toString();
        if (!this.questionSetAccordionData.has(setId)) {
          this.questionSetAccordionData.set(setId, {
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
            originalSelectedIds: [],
          });
        } else {
          const existingData = this.questionSetAccordionData.get(setId);
          if (existingData) {
            existingData.questionSet = qs;
            this.questionSetAccordionData.set(setId, {
              ...existingData,
            });
          }
        }
      });
      this.setOptions();

      // Eagerly load selected questions for all sets so we can validate if they are empty
      res.data.forEach((qs) => {
        if (qs.id !== 0) {
          const setId = qs.id.toString();
          if (!this.questionSetAccordionData.get(setId)?.hasLoadedSelectedQuestions) {
            this.loadQuestionsForAccordion(setId);
          }
        }
      });

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
    if (!payload.filterMap) {
      payload.filterMap = {};
    }
    payload.filterMap['status'] = 'active';

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

  public onAccordionOpen(questionSetId: string): void {
    if (!questionSetId) {
      return;
    }

    const questionSet = this.questionSets.find(
      (qs) => qs.id.toString() === questionSetId || qs.id === Number(questionSetId),
    );

    if (questionSet) {
      this.currentSelectedQuestionSetId = questionSetId;
      const accordionData = this.questionSetAccordionData.get(questionSetId);

      if (!accordionData) {
        return;
      }

      if (questionSet.id === 0) {
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

      const shouldReloadSummary = !accordionData.hasLoadedSelectedQuestions || 
                                 (!accordionData.isLoadingSelectedQuestions && (!accordionData.groupedSelectedData || accordionData.groupedSelectedData.length === 0));

      if (shouldReloadSummary) {
        this.loadQuestionsForAccordion(questionSetId, () => {
          const freshData = this.questionSetAccordionData.get(questionSetId);
          if (freshData && !freshData.hasLoadedTableData) {
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

    const realQuestionSetId = accordionData.questionSet.id.toString();

    this.assessmentService.getQuestionsBySet(realQuestionSetId).subscribe({
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

        accordionData.originalSelectedIds = [...accordionData.selectedIds];

        if (accordionData.selectedIds.length > 0) {
          accordionData.isUpdate = true;
        }

        this.questionSetAccordionData.set(questionSetId, { ...accordionData });
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
        accordionData.originalSelectedIds = [...accordionData.selectedIds];
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

    if (!payload.filterMap) {
      payload.filterMap = {};
    }
    payload.filterMap['status'] = 'active';

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
    if (!this.hasSubmittedQuestionSets) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select questions for all created Question Sets.',
      });
      return;
    }

    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.isLoading = true;
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          this.isLoading = false;
          this.stepsStatusService.notifyStepCompleted(assessmentId);
          this.hasLocalModifications = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question Set step completed successfully',
          });
        },
        error: () => {
          this.isLoading = false;
          this.stepsStatusService.notifyStepCompleted(assessmentId);
          this.hasLocalModifications = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Question Set step completed successfully',
          });
        },
      });
    }
  }

  public getQuestionSetsForRound(roundId: number): QuestionSetModel[] {
    return this.questionSets.filter(
      (qs) => qs.assessmentRoundId === roundId && qs.id > 0,
    );
  }

  public get emptyQuestionSets(): string[] {
    const emptyNames: string[] = [];
    for (const data of this.questionSetAccordionData.values()) {
      if (data.questionSet.id > 0) {
        if (data.hasLoadedSelectedQuestions && (!data.selectedIds || data.selectedIds.length === 0)) {
          emptyNames.push(data.questionSet.title);
        }
      }
    }
    return emptyNames;
  }

  /**
   * Returns true if any created question set is missing selected questions.
   * If this is true, we should block ANY navigation away from this step.
   */
  public get hasIncompleteQuestionSets(): boolean {
    // 1. If server-side check (passed from parent) says it's incomplete, it's incomplete
    if (this.isIncomplete()) return true;

    // 2. If any set is still loading, it's incomplete
    for (const data of this.questionSetAccordionData.values()) {
      if (data.questionSet.id > 0 && !data.hasLoadedSelectedQuestions) {
        return true;
      }
    }

    // 3. Check if any question set is confirmed empty
    return this.emptyQuestionSets.length > 0;
  }

  /**
   * Returns true if every assessment round has at least one question set.
   * Required for forward navigation.
   */
  public get hasAllRoundsConfigured(): boolean {
    const createdSets = this.questionSets.filter((qs) => qs.id > 0);
    if (createdSets.length === 0) return false;

    const roundIdsWithSets = new Set(createdSets.map((qs) => qs.assessmentRoundId));
    const allRoundIds = new Set(
      this.questionSets.map((qs) => qs.assessmentRoundId),
    );

    return roundIdsWithSets.size === allRoundIds.size;
  }

  public get isDirty(): boolean {
    if (this.hasLocalModifications) return true;

    // 1. Check if any question set's selections have changed
    for (const data of this.questionSetAccordionData.values()) {
      const current = [...(data.selectedIds || [])].sort().join(',');
      const original = [...(data.originalSelectedIds || [])].sort().join(',');
      if (current !== original) return true;
    }
    return false;
  }

  public get hasSubmittedQuestionSets(): boolean {
    if (this.isParentLoading()) return false;

    const allRounds = this.hasAllRoundsConfigured;
    const isIncomplete = this.hasIncompleteQuestionSets;
    const isValid = allRounds && !isIncomplete;
    const isDirty = this.isDirty;
    const status = this.stepStatus();
    
    console.log(`[Button Debug]`, {
      label: 'Complete Button State',
      isEnabled: isValid && (status !== 'Completed' || isDirty),
      isValid,
      isDirty,
      status,
      allRounds,
      isIncomplete,
      hasLocalModifications: this.hasLocalModifications
    });

    if (!isValid) return false;

    // If step is already completed, it only stays enabled if there are new changes (isDirty) or modifications in session
    if (status === 'Completed') {
      return isDirty || this.hasModifiedAfterComplete();
    }

    // If step is not yet completed (Active/Pending), allow completion if valid
    return true;
  }

  private restoreSearchValueOnly(questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData?.searchValue) {
      return;
    }

    try {
      const questionSetIndex = this.questionSets.findIndex(
        (qs) => (qs.assessmentRoundId || qs.id).toString() === questionSetId,
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

  public onRowExpand(id: string, questionSetId: string): void {
    const accordionData = this.questionSetAccordionData.get(questionSetId);
    if (!accordionData || !accordionData.tabledata) return;

    const questionId = Number(id);
    const question = accordionData.tabledata.data.find(
      (q: any) => q.id == questionId,
    );
    if (!question) return;

    if (question.hasAttachment) {
      this.loadQuestionImage(questionId, questionSetId);
    }

    if (question.options) {
      question.options.forEach((opt: any) => {
        if (opt.hasAttachments) {
          this.loadOptionImage(opt.id, questionSetId);
        }
      });
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

    accordionData.isImageLoadings = { ...accordionData.isImageLoadings, [id]: true };
    this.questionSetAccordionData.set(questionSetId, { ...accordionData });

    this.questionService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          const latestAccordionData = this.questionSetAccordionData.get(questionSetId);
          if (!latestAccordionData) return;

          if (!latestAccordionData.previewImageUrls) {
            latestAccordionData.previewImageUrls = {};
          }

          const imageUrl = URL.createObjectURL(blob);
          const currentUrls = latestAccordionData.previewImageUrls[id]
            ? [...latestAccordionData.previewImageUrls[id]]
            : [];
          currentUrls.push(imageUrl);

          latestAccordionData.previewImageUrls = {
            ...latestAccordionData.previewImageUrls,
            [id]: currentUrls,
          };
          this.questionSetAccordionData.set(questionSetId, {
            ...latestAccordionData,
          });
          this.cdr.markForCheck();

          setTimeout(() => {
            const finalAccordionData = this.questionSetAccordionData.get(questionSetId);
            if (finalAccordionData && finalAccordionData.isImageLoadings) {
              finalAccordionData.isImageLoadings = {
                ...finalAccordionData.isImageLoadings,
                [id]: false,
              };
              this.questionSetAccordionData.set(questionSetId, {
                ...finalAccordionData,
              });
              this.cdr.markForCheck();
            }
          }, 300);
        },
        error: () => {
          const errorAccordionData = this.questionSetAccordionData.get(questionSetId);
          if (errorAccordionData && errorAccordionData.isImageLoadings) {
            errorAccordionData.isImageLoadings = {
              ...errorAccordionData.isImageLoadings,
              [id]: false,
            };
            this.questionSetAccordionData.set(questionSetId, {
              ...errorAccordionData,
            });
            this.cdr.markForCheck();
          }
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
      accordionData.isImageLoadings = { ...accordionData.isImageLoadings, [id]: true };
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
      accordionData.isImageLoadings = { ...accordionData.isImageLoadings, [id]: true };
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
