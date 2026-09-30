import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentViewComponent } from './assessment-view.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { StepsStatusService } from '../../services/steps-status.service';
import { AssessmentScheduleService } from '../../services/assessment-schedule.service';
import { AssessmentService } from '../../../../services/assessment.service';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('AssessmentViewComponent', () => {
  let component: AssessmentViewComponent;
  let fixture: ComponentFixture<AssessmentViewComponent>;

  const mockStepsStatusService = {
    stepStatusUpdate$: of(1),
    stepCompleted$: of(1),
    getAssessmentStepsStatus: () =>
      of({
        rounds: 'Pending',
        questionSets: 'Pending',
        coordinators: 'Pending',
        frontDesk: 'Pending',
        interviewers: 'Pending',
        schedule: 'Pending',
      }),
  };

  const mockAssessmentScheduleService = {
    GetAssessmentRound: () => of([]),
    getAllCoordinators: () => of({}),
    getFrontDeskUserList: () => of({}),
  };

  const mockAssessmentService = {
    getEntityById: () => of({ id: 1, name: 'Test Assessment' }),
    getAllEntities: () => of({}),
    paginationEntity: () => of({ data: [{ id: 1, assessmentRoundId: 1 }] }),
    getQuestionsBySet: () => of({ questions: [{ questionId: 1 }] }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentViewComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        DialogService,
        { provide: StepsStatusService, useValue: mockStepsStatusService },
        {
          provide: AssessmentScheduleService,
          useValue: mockAssessmentScheduleService,
        },
        { provide: AssessmentService, useValue: mockAssessmentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate stepMenuItems from filteredStepConfig', () => {
    expect(component.stepMenuItems.length).toBeGreaterThan(0);
    expect(component.stepMenuItems[0].label).toBe('Rounds');
  });

  it('should initialize activeStep as -1 and stepsLoaded as false before loading', () => {
    const newComponent = TestBed.createComponent(AssessmentViewComponent).componentInstance;
    expect(newComponent.activeStep).toBe(-1);
    expect(newComponent.stepsLoaded).toBeFalse();
  });

  it('should activate schedule step (index 4) when schedule step is Active', () => {
    component.assessmentId = 1;
    const stepsStatusService = TestBed.inject(StepsStatusService);
    const assessmentScheduleService = TestBed.inject(AssessmentScheduleService);

    spyOn(stepsStatusService, 'getAssessmentStepsStatus').and.returnValue(
      of({
        rounds: 'Completed',
        questionSets: 'Completed',
        coordinators: 'Completed',
        frontDesk: 'Completed',
        interviewers: 'Completed',
        schedule: 'Active',
      })
    );
    spyOn(assessmentScheduleService, 'GetAssessmentRound').and.returnValue(
      of([
        { id: 1, roundTypeId: 1 } as any,
        { id: 2, roundTypeId: 2 } as any,
      ])
    );

    component.loadStepsStatus(true);

    expect(component.stepsLoaded).toBeTrue();
    expect(component.activeStep).toBe(4);
  });

  it('should set isQuestionSetIncomplete to true and downgrade questionSets to Active when a question set has no questions', () => {
    component.assessmentId = 1;
    const stepsStatusService = TestBed.inject(StepsStatusService);
    const assessmentScheduleService = TestBed.inject(AssessmentScheduleService);
    const assessmentService = TestBed.inject(AssessmentService);

    spyOn(stepsStatusService, 'getAssessmentStepsStatus').and.returnValue(
      of({
        rounds: 'Completed',
        questionSets: 'Completed',
        coordinators: 'Pending',
        frontDesk: 'Pending',
        interviewers: 'Pending',
        schedule: 'Pending',
      })
    );
    spyOn(assessmentScheduleService, 'GetAssessmentRound').and.returnValue(
      of([{ id: 1, roundTypeId: 1 } as any])
    );
    spyOn(assessmentService, 'paginationEntity').and.returnValue(
      of({
        data: [
          { id: 10, assessmentRoundId: 1, title: 'Set A' },
          { id: 20, assessmentRoundId: 1, title: 'SET B' },
        ],
      } as any)
    );
    spyOn(assessmentService, 'getQuestionsBySet').and.callFake((setId: string) => {
      if (setId === '10') {
        return of({ questionSetId: '10', questions: [{ questionId: 1 }] } as any);
      }
      return of({ questionSetId: '20', questions: [] } as any);
    });

    component.loadStepsStatus(true);

    expect(component.isQuestionSetIncomplete).toBeTrue();
    expect(component.stepsStatus.questionSets).toBe('Active');
    expect(component.activeStep).toBe(1);
    expect(component.isStepEnabled(2)).toBeFalse();
    const questionSetMenuItem = component.stepMenuItems.find((m) => m['index'] === 1);
    expect(questionSetMenuItem?.['completed']).toBeFalse();
  });

  it('should update incomplete status and disable coordinator when onQuestionSetIncompleteChange is emitted', () => {
    component.stepsLoaded = true;
    component.stepsStatus = {
      rounds: 'Completed',
      questionSets: 'Completed',
      coordinators: 'Pending',
      frontDesk: 'Pending',
      interviewers: 'Pending',
      schedule: 'Pending',
    };
    component.completedSteps = [0, 1];
    component.assessmentRounds = [{ id: 1, roundTypeId: 1 } as any];

    component.onQuestionSetIncompleteChange(true);

    expect(component.isQuestionSetIncomplete).toBeTrue();
    expect(component.completedSteps.includes(1)).toBeFalse();
    expect(component.isStepEnabled(2)).toBeFalse();

    // When restored to complete
    component.onQuestionSetIncompleteChange(false);
    expect(component.isQuestionSetIncomplete).toBeFalse();
    expect(component.completedSteps.includes(1)).toBeTrue();
    expect(component.isStepEnabled(2)).toBeTrue();
    expect(component.stepMenuItems.find((m) => m['index'] === 1)?.['completed']).toBeTrue();
  });

  it('should handle onQuestionSetStateChange when set is modified and restored', () => {
    component.stepsLoaded = true;
    component.stepsStatus = {
      rounds: 'Completed',
      questionSets: 'Completed',
      coordinators: 'Pending',
      frontDesk: 'Pending',
      interviewers: 'Pending',
      schedule: 'Pending',
    };
    component.completedSteps = [0, 1];
    component.assessmentRounds = [{ id: 1, roundTypeId: 1 } as any];

    // When modified (e.g. created a set)
    component.onQuestionSetStateChange({ isIncomplete: true, isModified: true });
    expect(component.isQuestionSetIncomplete).toBeTrue();
    expect(component.hasModifiedQuestionSetAfterComplete).toBeTrue();
    expect(component.isStepEnabled(2)).toBeFalse();
    expect(component.stepMenuItems.find((m) => m['index'] === 1)?.['completed']).toBeFalse();

    // When restored (e.g. deleted that created set)
    component.onQuestionSetStateChange({ isIncomplete: false, isModified: false });
    expect(component.isQuestionSetIncomplete).toBeFalse();
    expect(component.hasModifiedQuestionSetAfterComplete).toBeFalse();
    expect(component.isStepEnabled(2)).toBeTrue();
    expect(component.stepMenuItems.find((m) => m['index'] === 1)?.['completed']).toBeTrue();
  });
});
