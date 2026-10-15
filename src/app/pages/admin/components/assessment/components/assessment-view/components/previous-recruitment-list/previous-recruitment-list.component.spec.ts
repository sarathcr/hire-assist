import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { PreviousRecruitmentListComponent } from './previous-recruitment-list.component';
import { GenericDataSource } from '../../../../../../../../shared/components/pagination/generic-data-source';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { MessageService } from 'primeng/api';

describe('PreviousRecruitmentListComponent', () => {
  let component: PreviousRecruitmentListComponent;
  let fixture: ComponentFixture<PreviousRecruitmentListComponent>;
  let router: Router;

  const mockDataSubject = new BehaviorSubject<any[]>([]);
  const mockTotalRecords = new BehaviorSubject<number>(0);
  const mockLoading = new BehaviorSubject<boolean>(false);

  const mockDataSource = {
    init: jasmine.createSpy('init'),
    connect: jasmine.createSpy('connect').and.returnValue(mockDataSubject.asObservable()),
    totalRecords: mockTotalRecords,
    loading$: mockLoading.asObservable(),
    loadPaginatedData: jasmine.createSpy('loadPaginatedData'),
    getPayloadData: jasmine.createSpy('getPayloadData').and.returnValue({
      sortedColumn: { active: '', direction: '' },
      filterMap: {},
      pagination: { pageNumber: 1, pageSize: 10 },
    }),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          if (key === 'candidateId') return 'cand-123';
          if (key === 'recruitmentId') return '42';
          return null;
        },
      },
    },
    paramMap: of({
      get: (key: string) => {
        if (key === 'candidateId') return 'cand-123';
        if (key === 'recruitmentId') return '42';
        return null;
      },
    }),
  };

  beforeEach(async () => {
    mockDataSource.loadPaginatedData.calls.reset();
    mockDataSource.init.calls.reset();

    await TestBed.configureTestingModule({
      imports: [PreviousRecruitmentListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AssessmentService, useValue: {} },
      ],
    })
      .overrideComponent(PreviousRecruitmentListComponent, {
        set: {
          providers: [{ provide: GenericDataSource, useValue: mockDataSource }],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(PreviousRecruitmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with candidateId and recruitmentId from route params', () => {
    expect(component.candidateId).toBe('cand-123');
    expect(component.recruitmentId).toBe(42);
  });

  it('should include assessmentId in getBaseFilterMap to exclude active recruitment', () => {
    const filterMap = component.getBaseFilterMap();
    expect(filterMap['candidateId']).toBe('cand-123');
    expect(filterMap['assessmentId']).toBe(42);
  });

  it('should pass assessmentId in filterMap when loading paginated data', () => {
    expect(mockDataSource.loadPaginatedData).toHaveBeenCalledWith(
      jasmine.objectContaining({
        filterMap: jasmine.objectContaining({
          candidateId: 'cand-123',
          assessmentId: 42,
        }),
      })
    );
  });

  it('should filter out the active recruitment (recruitmentId 42) from recruitmentDataSource defensively', () => {
    const mockRecruitments = [
      { id: 42, assessmentId: 42, assessmentName: 'Current Active Recruitment' },
      { id: 10, assessmentId: 10, assessmentName: 'Previous Recruitment 2025' },
      { id: 15, assessmentId: 15, assessmentName: 'Older Recruitment 2024' },
    ];

    mockDataSubject.next(mockRecruitments);

    expect(component.recruitmentDataSource.length).toBe(2);
    expect(component.recruitmentDataSource.some((r) => r.id === 42 || r.assessmentId === 42)).toBeFalse();
    expect(component.recruitmentDataSource[0].assessmentName).toBe('Previous Recruitment 2025');
  });

  it('should include assessmentId and searchKey in filterMap when updated', () => {
    component.searchKey = 'developer';
    component.updateFilterMap();
    expect(component.filterMap['candidateId']).toBe('cand-123');
    expect(component.filterMap['assessmentId']).toBe(42);
    expect(component.filterMap['searchKey']).toBe('developer');
  });

  it('should maintain assessmentId when onTablePayloadChange is called', () => {
    mockDataSource.loadPaginatedData.calls.reset();
    component.onTablePayloadChange({
      multiSortedColumns: [{ active: 'assessmentName', direction: 'asc' }],
      filterMap: {},
      pagination: { pageNumber: 2, pageSize: 5 },
    });

    expect(mockDataSource.loadPaginatedData).toHaveBeenCalledWith(
      jasmine.objectContaining({
        filterMap: jasmine.objectContaining({
          candidateId: 'cand-123',
          assessmentId: 42,
        }),
      })
    );
  });

  it('should navigate back to the current active recruitment schedule page', () => {
    component.navigateBack();
    expect(router.navigate).toHaveBeenCalledWith(['admin/recruitments/schedule/42']);
  });
});
