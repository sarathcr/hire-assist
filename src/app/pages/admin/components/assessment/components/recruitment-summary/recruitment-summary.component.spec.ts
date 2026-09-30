import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecruitmentSummaryComponent } from './recruitment-summary.component';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { InterviewService } from '../../services/interview.service';
import { AssessmentService } from '../../../../services/assessment.service';

describe('RecruitmentSummaryComponent', () => {
  let component: RecruitmentSummaryComponent;
  let fixture: ComponentFixture<RecruitmentSummaryComponent>;

  const mockInterviewService = {
    getSelectedStatus: jasmine.createSpy('getSelectedStatus').and.returnValue(
      of({
        recruitmentName: 'Test Recruitment',
        detailedCandidates: [],
      })
    ),
    exportRecruitmentSummaryPdf: jasmine
      .createSpy('exportRecruitmentSummaryPdf')
      .and.returnValue(of(new Blob(['dummy pdf content'], { type: 'application/pdf' }))),
  };

  const mockAssessmentService = {
    getIdProofsByCandidateId: jasmine
      .createSpy('getIdProofsByCandidateId')
      .and.returnValue(of([])),
  };

  const mockActivatedRoute = {
    params: of({ id: '10' }),
  };

  const mockLocation = {
    back: jasmine.createSpy('back'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecruitmentSummaryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        MessageService,
        { provide: InterviewService, useValue: mockInterviewService },
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecruitmentSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch summary data on init', () => {
    expect(component.assessmentId).toBe(10);
    expect(mockInterviewService.getSelectedStatus).toHaveBeenCalledWith(10);
  });

  it('should call exportRecruitmentSummaryPdf and downloadBlob when exportPdf is triggered', async () => {
    spyOn(component, 'downloadBlob').and.returnValue(Promise.resolve(true));

    await component.exportPdf();

    expect(mockInterviewService.exportRecruitmentSummaryPdf).toHaveBeenCalledWith(10);
    expect(component.downloadBlob).toHaveBeenCalled();
    expect(component.showPdfModal).toBeFalse();
  });

  it('should open showPdfModal when previewPdf is triggered', async () => {
    await component.previewPdf();

    expect(component.showPdfModal).toBeTrue();
    expect(component.pdfUrlString).toBeTruthy();
  });

  it('should call downloadBlob with currentPdfBlob when downloadPdf is called from modal', async () => {
    const dummyBlob = new Blob(['pdf'], { type: 'application/pdf' });
    component.currentPdfBlob = dummyBlob;
    spyOn(component, 'downloadBlob').and.returnValue(Promise.resolve(true));

    await component.downloadPdf();

    expect(component.downloadBlob).toHaveBeenCalledWith(
      dummyBlob,
      jasmine.stringMatching(/Audit_Report.*\.pdf/)
    );
  });

  it('should use navigator.share on iOS device when Web Share API is available', async () => {
    spyOn(component, 'isIOSDevice').and.returnValue(true);
    const mockShare = jasmine.createSpy('share').and.returnValue(Promise.resolve());
    const mockCanShare = jasmine.createSpy('canShare').and.returnValue(true);

    (navigator as any).share = mockShare;
    (navigator as any).canShare = mockCanShare;

    const dummyBlob = new Blob(['sample pdf'], { type: 'application/pdf' });
    const result = await component.downloadBlob(dummyBlob, 'test.pdf');

    expect(result).toBeTrue();
    expect(mockCanShare).toHaveBeenCalled();
    expect(mockShare).toHaveBeenCalled();
  });
});
