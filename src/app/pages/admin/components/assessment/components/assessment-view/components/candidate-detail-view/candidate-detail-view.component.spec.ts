import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CandidateDetailViewComponent } from './candidate-detail-view.component';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { InterviewService } from '../../../../services/interview.service';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CandidateDetailViewComponent', () => {
  let component: CandidateDetailViewComponent;
  let fixture: ComponentFixture<CandidateDetailViewComponent>;

  const mockAssessmentService = {
    getCandidateDetails: jasmine.createSpy('getCandidateDetails').and.returnValue(of({}))
  };

  const mockInterviewService = {
    GetCandidateAssessmentDetails: jasmine.createSpy('GetCandidateAssessmentDetails').and.returnValue(of([])),
    GetCandidateDetails: jasmine.createSpy('GetCandidateDetails').and.returnValue(of({}))
  };

  const createComponent = async (interviewId: string | null) => {
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => {
            if (key === 'recruitmentId') return '1';
            if (key === 'candidateId') return 'test_candidate';
            if (key === 'interviewId') return interviewId;
            return null;
          }
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NoopAnimationsModule, RouterModule.forRoot([]), CandidateDetailViewComponent],
      providers: [
        { provide: AssessmentService, useValue: mockAssessmentService },
        { provide: InterviewService, useValue: mockInterviewService }
      ]
    })
    .overrideComponent(CandidateDetailViewComponent, {
      set: {
        providers: [
          { provide: ActivatedRoute, useValue: mockActivatedRoute }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };
  
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await createComponent('0');
    expect(component).toBeTruthy();
  });

  it('should hide interview feedback tab when interviewId is 0 or missing', async () => {
    await createComponent('0');
    const tabs = fixture.debugElement.queryAll(By.css('p-tab'));
    expect(tabs.length).toBe(2);
  });

  it('should show interview feedback tab when interviewId is greater than 0', async () => {
    await createComponent('123');
    const tabs = fixture.debugElement.queryAll(By.css('p-tab'));
    expect(tabs.length).toBe(3);
  });
});
