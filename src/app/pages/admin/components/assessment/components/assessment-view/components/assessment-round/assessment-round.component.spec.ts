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
    component['setConfigMaps']();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show min validation error when toggling from online to offline and back to online', () => {
    component.roundTypeOptions = [
      { label: 'Online Aptitude Test', value: '1' },
      { label: 'Offline Panel Interview', value: '2' },
    ];
    component.submittedData = [
      {
        id: '1',
        name: 'Aptitude Round',
        roundType: '1',
        maxTerminationCount: 2,
        durationDate: new Date(),
        feedbackCriteria: [],
        sequence: 1,
        timerHour: 0,
      } as any,
    ];

    component.buildRoundConfigForms();
    const group = component.roundConfigForms.at(0);
    const countCtrl = group.get('maxTerminationCount');
    const roundTypeCtrl = group.get('roundType');

    // Initially 2
    expect(countCtrl?.value).toBe(2);
    expect(countCtrl?.valid).toBeTrue();

    // Switch to offline (2)
    roundTypeCtrl?.setValue('2');
    expect(countCtrl?.valid).toBeTrue();

    // Switch back to online (1)
    roundTypeCtrl?.setValue('1');
    expect(countCtrl?.value).toBe(2);
    expect(countCtrl?.valid).toBeTrue();
    expect(countCtrl?.hasError('min')).toBeFalse();
  });

  it('should include frontdesk dependency reason when removing the last round and frontdesk is assigned', () => {
    (component as any).hasFrontDeskAssigned = () => true;
    const testRound = {
      id: '1',
      name: 'Round 1',
    } as any;

    const reasons = component['getRoundDependencyReasons'](testRound, true);
    const hasFrontDesk = reasons.some((r) => r.type === 'frontdesk');
    expect(hasFrontDesk).toBeTrue();
  });

  it('should not include frontdesk dependency reason when remaining rounds exist', () => {
    (component as any).hasFrontDeskAssigned = () => true;
    const testRound = {
      id: '1',
      name: 'Round 1',
    } as any;

    const reasons = component['getRoundDependencyReasons'](testRound, false);
    const hasFrontDesk = reasons.some((r) => r.type === 'frontdesk');
    expect(hasFrontDesk).toBeFalse();
  });
});
