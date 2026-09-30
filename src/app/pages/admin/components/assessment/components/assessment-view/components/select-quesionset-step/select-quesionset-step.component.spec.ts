import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { QuestionService } from '../../../../../../services/question.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { InterviewService } from '../../../../services/interview.service';
import { InstructionService } from '../../../../../../services/instruction.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { QuestionSetModel } from '../../../../../../models/question.model';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { SelectQuesionsetStepComponent } from './select-quesionset-step.component';

describe('SelectQuesionsetStepComponent', () => {
  let component: SelectQuesionsetStepComponent;
  let fixture: ComponentFixture<SelectQuesionsetStepComponent>;
  let mockDialogService: { open: jasmine.Spy };
  let mockAssessmentService: {
    paginationEntity: jasmine.Spy;
    createEntity: jasmine.Spy;
    updateEntity: jasmine.Spy;
    deleteQuestionSet: jasmine.Spy;
    getQuestionsBySet: jasmine.Spy;
  };
  let mockInstructionService: {
    getInstructions: jasmine.Spy;
    assignInstructionToRound: jasmine.Spy;
    saveAsNewVersion: jasmine.Spy;
    createInstruction: jasmine.Spy;
    updateInstruction: jasmine.Spy;
  };
  let mockAssessmentScheduleService: {
    GetAssessmentRound: jasmine.Spy;
  };
  let mockStepsStatusService: {
    notifyStepStatusUpdate: jasmine.Spy;
    notifyStepCompleted: jasmine.Spy;
    getAssessmentStepsStatus: jasmine.Spy;
  };

  beforeEach(async () => {
    mockDialogService = { open: jasmine.createSpy('open') };
    mockAssessmentService = {
      paginationEntity: jasmine.createSpy('paginationEntity').and.returnValue(
        of({ data: [], total: 0, page: 1, pageSize: 10 }),
      ),
      createEntity: jasmine.createSpy('createEntity').and.returnValue(of({})),
      updateEntity: jasmine.createSpy('updateEntity').and.returnValue(of({})),
      deleteQuestionSet: jasmine.createSpy('deleteQuestionSet').and.returnValue(of({})),
      getQuestionsBySet: jasmine.createSpy('getQuestionsBySet').and.returnValue(of({ data: [] })),
    };
    mockInstructionService = {
      getInstructions: jasmine.createSpy('getInstructions').and.returnValue(of([])),
      assignInstructionToRound: jasmine.createSpy('assignInstructionToRound').and.returnValue(of(true)),
      saveAsNewVersion: jasmine.createSpy('saveAsNewVersion').and.returnValue(of({})),
      createInstruction: jasmine.createSpy('createInstruction').and.returnValue(of({})),
      updateInstruction: jasmine.createSpy('updateInstruction').and.returnValue(of({})),
    };
    mockAssessmentScheduleService = {
      GetAssessmentRound: jasmine.createSpy('GetAssessmentRound').and.returnValue(of([])),
    };
    mockStepsStatusService = {
      notifyStepStatusUpdate: jasmine.createSpy('notifyStepStatusUpdate'),
      notifyStepCompleted: jasmine.createSpy('notifyStepCompleted'),
      getAssessmentStepsStatus: jasmine.createSpy('getAssessmentStepsStatus').and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [SelectQuesionsetStepComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: { add: jasmine.createSpy() } },
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: DialogService, useValue: mockDialogService },
        { provide: QuestionService, useValue: {} },
        { provide: StepsStatusService, useValue: mockStepsStatusService },
        { provide: InterviewService, useValue: {} },
        { provide: InstructionService, useValue: mockInstructionService },
        { provide: AssessmentScheduleService, useValue: mockAssessmentScheduleService },
        QuestionSetStateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectQuesionsetStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update in-memory title and re-fetch question sets when editing a question set succeeds', () => {
    const existingQuestionSet: QuestionSetModel = {
      id: 10,
      assessmentId: 1,
      title: 'Original Title',
      description: 'Original Description',
      isActive: true,
      createdAt: '2026-01-01',
      createdBy: 'Admin',
      assessmentRoundId: 1,
    };
    mockAssessmentService.paginationEntity.and.returnValue(
      of({
        data: [
          {
            ...existingQuestionSet,
            title: 'Updated Title',
            description: 'Updated Description',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
    );

    const closeSubject = new Subject<any>();
    mockDialogService.open.and.returnValue({
      onClose: closeSubject.asObservable(),
    });

    component.questionSets = [existingQuestionSet];
    component.onEditQuestionSet(existingQuestionSet);

    expect(mockDialogService.open).toHaveBeenCalled();

    // Simulate dialog closing with updated data
    closeSubject.next({
      isCreateSuccess: true,
      isUpdateSuccess: true,
      data: {
        id: 10,
        title: 'Updated Title',
        description: 'Updated Description',
      },
    });

    // Verify in-memory question set was updated immediately
    expect(component.questionSets[0].title).toBe('Updated Title');
    expect(component.questionSets[0].description).toBe('Updated Description');

    // Verify paginationEntity was called to fetch updated question sets from server
    expect(mockAssessmentService.paginationEntity).toHaveBeenCalledWith(
      'QuestionSetSummary',
      jasmine.any(Object),
    );
  });

  it('should load persisted round instructions from AssessmentScheduleService', () => {
    fixture.componentRef.setInput('assessmentId', 42);
    mockAssessmentScheduleService.GetAssessmentRound.and.returnValue(
      of([
        {
          id: 101,
          roundId: 1,
          round: 'Aptitude Test',
          instructionId: 5,
          sequence: 1,
          statusId: 1,
          status: 'Active',
          isActive: true,
        },
      ]),
    );

    component.loadAssessmentRounds();

    expect(mockAssessmentScheduleService.GetAssessmentRound).toHaveBeenCalledWith(42);
    expect(component.getRoundInstructionId(101)).toBe(5);
  });

  it('should preserve previously configured round instruction even if global settings default changes', () => {
    component.roundInstructionMap.set(101, 5);

    // Now mock instructions where a different instruction (id: 99) is marked as default
    mockInstructionService.getInstructions.and.returnValue(
      of([
        { id: 5, title: 'Old Default Instructions', version: 1, isDefault: false },
        { id: 99, title: 'New Default Instructions', version: 1, isDefault: true },
      ]),
    );

    component.loadInstructions();

    // The round should retain its configured instruction (id: 5), not be overwritten by 99
    expect(component.getRoundInstructionId(101)).toBe(5);
  });

  it('should call assignInstructionToRound and update roundInstructionMap when manually changing instruction', () => {
    component.assessmentRounds = [
      { id: 101, assessmentRoundId: 101, title: 'Round 1 Set', roundName: 'Round 1' } as any,
    ];

    component.onRoundInstructionChange(101, 8);

    expect(component.getRoundInstructionId(101)).toBe(8);
    expect(mockInstructionService.assignInstructionToRound).toHaveBeenCalledWith({
      assessmentRoundId: 101,
      instructionId: 8,
    });
  });

  it('should persist round instructions for all rounds before completing the question set step', () => {
    fixture.componentRef.setInput('assessmentId', 42);
    component.assessmentRounds = [
      { id: 101, assessmentRoundId: 101, title: 'Round 1 Set', roundName: 'Round 1' } as any,
      { id: 102, assessmentRoundId: 102, title: 'Round 2 Set', roundName: 'Round 2' } as any,
    ];
    component.roundInstructionMap.set(101, 5);
    component.roundInstructionMap.set(102, 6);

    spyOnProperty(component, 'hasSubmittedQuestionSets', 'get').and.returnValue(true);

    component.onCompleteQuestionSetStep();

    expect(mockInstructionService.assignInstructionToRound).toHaveBeenCalledWith({
      assessmentRoundId: 101,
      instructionId: 5,
    });
    expect(mockInstructionService.assignInstructionToRound).toHaveBeenCalledWith({
      assessmentRoundId: 102,
      instructionId: 6,
    });
    expect(mockStepsStatusService.getAssessmentStepsStatus).toHaveBeenCalledWith(42);
    expect(mockStepsStatusService.notifyStepCompleted).toHaveBeenCalledWith(42);
  });

  it('should emit incompleteChange and stepStateChange when notifyIncompleteStatus is called', () => {
    let emittedIncomplete: boolean | undefined;
    let emittedState: { isIncomplete: boolean; isModified: boolean } | undefined;
    component.incompleteChange.subscribe((val) => {
      emittedIncomplete = val;
    });
    component.stepStateChange.subscribe((val) => {
      emittedState = val;
    });

    spyOnProperty(component, 'hasIncompleteQuestionSets', 'get').and.returnValue(true);
    spyOnProperty(component, 'hasAllRoundsConfigured', 'get').and.returnValue(true);
    spyOnProperty(component, 'isModified', 'get').and.returnValue(false);

    component.notifyIncompleteStatus();

    expect(emittedIncomplete).toBeTrue();
    expect(emittedState).toEqual({ isIncomplete: true, isModified: false });
  });

  it('should restore isModified and isDirty to false when newly created question set is deleted', () => {
    const originalSet: QuestionSetModel = {
      id: 10,
      assessmentId: 1,
      title: 'Set 1',
      description: 'Set 1 description',
      assessmentRoundId: 1,
      isActive: true,
      createdAt: '',
      createdBy: '',
    };
    component.questionSets = [originalSet];
    component.questionSetAccordionData.set('10', {
      questionSet: originalSet,
      selectedIds: ['101', '102'],
      allSelectedQuestions: [],
      groupedSelectedData: [],
      totalScore: 10,
      isUpdate: true,
      isLoadingQuestions: false,
      isLoadingSelectedQuestions: false,
      hasLoadedSelectedQuestions: true,
      hasLoadedTableData: false,
      originalSelectedIds: ['101', '102'],
    });

    // Capture initial snapshot
    component.captureInitialSnapshot();
    expect(component.isModified).toBeFalse();
    expect(component.isDirty).toBeFalse();

    // Now simulate adding a new question set
    const newSet: QuestionSetModel = {
      id: 20,
      assessmentId: 1,
      title: 'Set 2',
      description: 'Set 2 description',
      assessmentRoundId: 1,
      isActive: true,
      createdAt: '',
      createdBy: '',
    };
    component.questionSets = [originalSet, newSet];
    component.questionSetAccordionData.set('20', {
      questionSet: newSet,
      selectedIds: [],
      allSelectedQuestions: [],
      groupedSelectedData: [],
      totalScore: 0,
      isUpdate: false,
      isLoadingQuestions: false,
      isLoadingSelectedQuestions: false,
      hasLoadedSelectedQuestions: true,
      hasLoadedTableData: false,
      originalSelectedIds: [],
    });

    expect(component.isModified).toBeTrue();
    expect(component.isDirty).toBeTrue();

    // Now simulate deleting the new set (restoring to originalSet only)
    component.questionSets = [originalSet];
    component.questionSetAccordionData.delete('20');

    expect(component.isModified).toBeFalse();
    expect(component.isDirty).toBeFalse();
  });

  it('should not enable hasSubmittedQuestionSets when step is Completed and not modified or dirty', () => {
    fixture.componentRef.setInput('stepStatus', 'Completed');
    fixture.componentRef.setInput('isParentLoading', false);

    spyOnProperty(component, 'hasAllRoundsConfigured', 'get').and.returnValue(true);
    spyOnProperty(component, 'hasIncompleteQuestionSets', 'get').and.returnValue(false);
    spyOnProperty(component, 'isDirty', 'get').and.returnValue(false);
    spyOnProperty(component, 'isModified', 'get').and.returnValue(false);

    expect(component.hasSubmittedQuestionSets).toBeFalse();
  });
});
