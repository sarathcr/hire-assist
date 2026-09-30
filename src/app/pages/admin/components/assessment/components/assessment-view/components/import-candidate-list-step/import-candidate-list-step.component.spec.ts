import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ImportCandidateListStepComponent } from './import-candidate-list-step.component';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { CandidateService } from '../../../../services/candidate.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';

describe('ImportCandidateListStepComponent', () => {
  let component: ImportCandidateListStepComponent;
  let fixture: ComponentFixture<ImportCandidateListStepComponent>;

  const mockAssessmentService = {
    paginationEntity: () => of({ data: [] }),
  };

  const mockCandidateService = {
    paginationEntity: () => of({ data: [], total: 0 }),
    getEntityById: () => of([]),
  };

  const mockQuestionSetStateService = {
    setQuestionSets: jasmine.createSpy('setQuestionSets'),
  };

  const mockStoreService = {};

  const mockStepsStatusService = {
    stepStatusUpdate$: of(1),
    stepCompleted$: of(1),
  };

  const mockTableDataSourceService = {
    setEndpoint: jasmine.createSpy('setEndpoint'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportCandidateListStepComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        DialogService,
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: CandidateService, useValue: mockCandidateService },
        { provide: QuestionSetStateService, useValue: mockQuestionSetStateService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StepsStatusService, useValue: mockStepsStatusService },
        { provide: TableDataSourceService, useValue: mockTableDataSourceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportCandidateListStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

