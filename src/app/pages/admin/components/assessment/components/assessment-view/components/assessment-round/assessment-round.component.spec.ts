import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { AssessmentRoundComponent } from './assessment-round.component';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { AssessmentScheduleService } from '../../../../services/assessment-schedule.service';
import { CollectionService } from '../../../../../../../../shared/services/collection.service';
import { StepsStatusService } from '../../../../services/steps-status.service';

describe('AssessmentRoundComponent', () => {
  let component: AssessmentRoundComponent;
  let fixture: ComponentFixture<AssessmentRoundComponent>;

  const mockStoreService = {
    selectedEntity$: of({ id: '1', name: 'Test' }),
  };

  const mockAssessmentScheduleService = {
    GetAssessmentRound: () => of([]),
    GetAssessmentRoundbyAssessment: () => of([]),
    addRound: () => of({}),
    saveAssessmentRound: () => of({}),
    fetchRoundTypeOptions: () => of([]),
  };

  const mockCollectionService = {
    getAllCollections: () => of([]),
  };

  const mockStepsStatusService = {
    stepStatusUpdate$: of(1),
    stepCompleted$: of(1),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentRoundComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        MessageService,
        DialogService,
        { provide: StoreService, useValue: mockStoreService },
        {
          provide: AssessmentScheduleService,
          useValue: mockAssessmentScheduleService,
        },
        { provide: CollectionService, useValue: mockCollectionService },
        { provide: StepsStatusService, useValue: mockStepsStatusService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentRoundComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
