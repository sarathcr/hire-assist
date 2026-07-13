import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterviewerFeedbackComponent } from './interviewer-feedback.component';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { StoreService } from '../../../../../../shared/services/store.service';
import { InterviewService } from '../../../../../admin/components/assessment/services/interview.service';
import { StepsStatusService } from '../../../../../admin/components/assessment/services/steps-status.service';

describe('InterviewerFeedbackComponent', () => {
  let component: InterviewerFeedbackComponent;
  let fixture: ComponentFixture<InterviewerFeedbackComponent>;
  let mockInterviewService: jasmine.SpyObj<InterviewService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockDialogService: jasmine.SpyObj<DialogService>;
  let mockStepsStatusService: jasmine.SpyObj<StepsStatusService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockInterviewService = jasmine.createSpyObj('InterviewService', [
      'GetCandidateDetails',
      'GetFeedbackCriteria',
    ]);
    mockStoreService = jasmine.createSpyObj('StoreService', ['getUserData']);
    mockStoreService.state$ = of({
      userState: { id: 'interviewer-1', name: 'Interviewer' },
    } as any);

    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);
    mockDialogService = jasmine.createSpyObj('DialogService', ['open']);
    mockStepsStatusService = jasmine.createSpyObj('StepsStatusService', ['getStatus']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockInterviewService.GetCandidateDetails.and.returnValue(of({
      candidateName: 'Test Candidate',
      candidateId: '386382096415',
      assessmentId: 95,
      isActive: true,
    } as any));
    mockInterviewService.GetFeedbackCriteria.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InterviewerFeedbackComponent],
      providers: [
        { provide: InterviewService, useValue: mockInterviewService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: DialogService, useValue: mockDialogService },
        { provide: StepsStatusService, useValue: mockStepsStatusService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                email: 'candidate@test.com',
                recruitmentId: '95',
                interviewId: '10',
                assessmentRoundId: '1',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewerFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly mask Aadhaar number', () => {
    expect(component.getMaskedAadhaar('123456789012')).toBe('•••• •••• 9012');
    expect(component.getMaskedAadhaar('1234 5678 9012')).toBe('•••• •••• 9012');
    expect(component.getMaskedAadhaar('')).toBe('');
    expect(component.getMaskedAadhaar('123')).toBe('123');
  });
});
