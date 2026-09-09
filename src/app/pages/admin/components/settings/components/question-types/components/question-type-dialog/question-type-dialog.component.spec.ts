import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { QuestionTypeDialogComponent } from './question-type-dialog.component';
import { QuestionTypeForm } from '../../../../../../models/question-type-form.model';
import { buildFormGroup } from '../../../../../../../../shared/utilities/form.utility';

describe('QuestionTypeDialogComponent', () => {
  let component: QuestionTypeDialogComponent;
  let fixture: ComponentFixture<QuestionTypeDialogComponent>;
  let mockDialogRef: { close: jasmine.Spy };
  let mockDialogConfig: { data: any };
  let formEntity: QuestionTypeForm;

  beforeEach(async () => {
    mockDialogRef = { close: jasmine.createSpy('close') };
    formEntity = new QuestionTypeForm();
    mockDialogConfig = {
      data: {
        fGroup: buildFormGroup(formEntity),
        configMap: formEntity.metadata.configMap,
      },
    };

    await TestBed.configureTestingModule({
      imports: [QuestionTypeDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: DynamicDialogConfig, useValue: mockDialogConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionTypeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.isEdit).toBeFalse();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should submit valid form in create mode', () => {
    component.data.fGroup.patchValue({ questionType: 'Multiple Choice' });
    component.onSubmit();
    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ questionType: 'Multiple Choice' }),
    );
  });

  it('should patch values and submit with id in edit mode', () => {
    mockDialogConfig.data.formData = { id: 123, questionType: 'Coding' };
    component.ngOnInit();

    expect(component.isEdit).toBeTrue();
    expect(component.data.fGroup.value.questionType).toBe('Coding');

    component.data.fGroup.patchValue({ questionType: 'Coding Updated' });
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 123, questionType: 'Coding Updated' }),
    );
  });
});
