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
});
