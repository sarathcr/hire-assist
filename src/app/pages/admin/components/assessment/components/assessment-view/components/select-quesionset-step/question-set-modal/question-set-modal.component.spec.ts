import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DynamicDialogRef, DynamicDialogConfig, DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AssessmentService } from '../../../../../../../services/assessment.service';
import { QuestionSetModalComponent } from './question-set-modal.component';

describe('QuestionSetModalComponent', () => {
  let component: QuestionSetModalComponent;
  let fixture: ComponentFixture<QuestionSetModalComponent>;
  let mockDialogRef: { close: jasmine.Spy };
  let mockAssessmentService: {
    createEntity: jasmine.Spy;
    updateEntity: jasmine.Spy;
  };
  let mockMessageService: { add: jasmine.Spy };

  beforeEach(async () => {
    mockDialogRef = { close: jasmine.createSpy('close') };
    mockAssessmentService = {
      createEntity: jasmine.createSpy('createEntity').and.returnValue(of({ success: true })),
      updateEntity: jasmine.createSpy('updateEntity').and.returnValue(of({ success: true })),
    };
    mockMessageService = { add: jasmine.createSpy('add') };

    await TestBed.configureTestingModule({
      imports: [QuestionSetModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        {
          provide: DynamicDialogConfig,
          useValue: {
            data: {
              assessmentId: 1,
              assessmentRoundId: 2,
              formData: {
                id: 10,
                title: 'Initial Title',
                description: 'Initial Description',
                assessmentId: 1,
                assessmentRoundId: 2,
              },
            },
          },
        },
        { provide: DialogService, useValue: {} },
        { provide: MessageService, useValue: mockMessageService },
        { provide: AssessmentService, useValue: mockAssessmentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionSetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch form values when formData has id (edit mode)', () => {
    expect(component.isEdit).toBeTrue();
    expect(component.questionSetFGroup.get('title')?.value).toBe('Initial Title');
    expect(component.questionSetFGroup.get('description')?.value).toBe('Initial Description');
  });

  it('should call updateEntity and close dialog with isUpdateSuccess and data when submitting in edit mode', () => {
    component.questionSetFGroup.patchValue({
      title: 'Updated Title',
      description: 'Updated Description',
    });

    component.onSubmit();

    expect(mockAssessmentService.updateEntity).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      isCreateSuccess: true,
      isUpdateSuccess: true,
      data: jasmine.objectContaining({
        id: 10,
        title: 'Updated Title',
        description: 'Updated Description',
        assessmentId: 1,
        assessmentRoundId: 2,
      }),
    });
  });

  it('should close with isCreateSuccess: false on onClose', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      isCreateSuccess: false,
      isUpdateSuccess: false,
    });
  });
});
