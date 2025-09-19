import { Component, input, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Knob } from 'primeng/knob';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { InputSelectComponent } from '../../../../../../../../shared/components/form/input-select/input-select.component';
import { InputTextComponent } from '../../../../../../../../shared/components/form/input-text/input-text.component';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';
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
  QuestionSetFormInterface,
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
@Component({
  selector: 'app-select-quesionset-step',
  imports: [
    InputTextComponent,
    InputTextareaComponent,
    ButtonComponent,
    ReactiveFormsModule,
    InputSelectComponent,
    ToastModule,
    TableComponent,
    QuestionSetStepSkeletonComponent,
    TableModule,
    Knob,
    FormsModule,
  ],
  templateUrl: './select-quesionset-step.component.html',
  styleUrl: './select-quesionset-step.component.scss',
  providers: [TableDataSourceService],
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
  private questionSets!: QuestionSetModel[];
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

  constructor(
    private readonly questionSetStateService: QuestionSetStateService,
    private readonly messageService: MessageService,
    private readonly assessmentService: AssessmentService,
    public dialog: DialogService,
    private readonly dataSourceService: TableDataSourceService<QuestionsModel>,
    private readonly questionService: QuestionService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.questionSetModal);
  }

  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllPaginatedQuestion(new PaginatedPayload());
    this.setConfigMaps();

    this.getAllQuestionSets(new PaginatedPayload());
    this.subscribeToQuestionSetChangesInFGroup();
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
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    childRef.onClose.subscribe();
  }
  public onSelectedIds(newIds: QuestionsModel[]) {
    const questionSetSelected = this.fGroup.get('questionSet')?.value;
    if (!questionSetSelected) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a Question Set before choosing questions.',
      });
      return;
    }
    this.selectedIds = Array.from(
      new Set([...newIds.map((item) => item.id.toString())]),
    );
    const pageSelected = (this.tabledata?.data || [])
      .filter((q: QuestionsModel) =>
        newIds.map((n) => n.id.toString()).includes(q.id.toString()),
      )
      .map((q: QuestionsModel) => ({
        questionId: Number(q.id),
        questionType: q.questionType ?? '',
        maxMark: q.maxMark ?? 0,
      }));

    const existingIds = new Set(
      this.allSelectedQuestions.map((q) => q.questionId),
    );

    const merged = [...this.allSelectedQuestions];
    pageSelected.forEach((q) => {
      if (!existingIds.has(q.questionId)) {
        merged.push(q);
      }
    });
    this.allSelectedQuestions = merged;

    const selectedQuestions: GetSelectedQuestionsForSet = {
      questionSetId: questionSetSelected,
      questions: this.allSelectedQuestions,
    };

    this.groupQuestionSet(selectedQuestions);
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }
  public onSubmit() {
    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: this.fGroup.value.questionSet,
      questionIds: this.selectedIds,
    };
    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Questions and set are saved Successfully',
      });
      this.isUpdate = true;
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
  public onUpdate() {
    this.isLoading = true;
    this.questionSetSubmittedData = {
      questionSetId: this.fGroup.value.questionSet,
      questionIds: this.selectedIds,
    };
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Questions and set are updated Successfully',
      });
      this.isLoading = false;
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
    this.isLoading = true;
    const payload: QuestionSetFormInterface = {
      ...this.fGroup.value,
      assessmentId: Number(this.assessmentId()),
    };

    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Created Question Set Successfully',
      });
      this.questionSetStateService.setUpdateSuccess(true);
      this.isLoading = false;
      if (!this.isLoading) this.getAllQuestionSets(new PaginatedPayload());
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
      .createEntity(payload, 'QuestionSet')
      .subscribe({ next, error });
  }

  //private Methods

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
  private subscribeToQuestionSetChangesInFGroup() {
    this.fGroup
      .get('questionSet')
      ?.valueChanges.subscribe((selectedId: string) => {
        if (selectedId) {
          this.GetSelectedQuestionsForSet(selectedId);
        } else {
          this.selectedIds = [];
        }
      });
  }
  private GetSelectedQuestionsForSet(selectedId: string) {
    this.isLoading = true;
    this.assessmentService.getQuestionsBySet(selectedId).subscribe({
      next: (res: GetSelectedQuestionsForSet) => {
        this.questiondata = res;
        this.selectedIds = res.questions.map((item: QuestionsSetQuesions) =>
          item.questionId.toString(),
        );
        if (this.selectedIds.length > 0) {
          this.isUpdate = true;
        }
        this.selectedData = this.tabledata.data.filter((item) =>
          this.selectedIds.includes(item.id.toString()),
        );
        this.groupQuestionSet(this.questiondata);

        if (this.selectedIds.length == 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'No questions selected for this set',
          });
        }
        this.isLoading = false;
      },
      error: (error: CustomErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.type,
        });
        this.isLoading = false;
      },
    });
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
}
