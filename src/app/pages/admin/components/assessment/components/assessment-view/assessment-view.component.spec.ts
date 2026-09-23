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
});
