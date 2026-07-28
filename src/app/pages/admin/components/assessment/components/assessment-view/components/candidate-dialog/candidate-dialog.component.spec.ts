import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CandidateDialogComponent } from './candidate-dialog.component';

describe('CandidateDialogComponent', () => {
  let component: CandidateDialogComponent;
  let fixture: ComponentFixture<CandidateDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockDialogConfig: DynamicDialogConfig;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    mockDialogConfig = {
      data: {
        title: 'Add Candidate',
        applicationQuestions: []
      }
    };

    await TestBed.configureTestingModule({
      imports: [CandidateDialogComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: DynamicDialogConfig, useValue: mockDialogConfig }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate currentLocation minLength and maxLength', () => {
    const control = component.fGroup.get('currentLocation');
    expect(control).toBeTruthy();
    if (!control) return;

    // Required check
    control.setValue('');
    expect(control.valid).toBeFalse();
    expect(control.errors?.['required']).toBeTruthy();

    // Minlength check
    control.setValue('ab');
    expect(control.valid).toBeFalse();
    expect(control.errors?.['minlength']).toBeTruthy();

    // Valid check
    control.setValue('abc');
    expect(control.valid).toBeTrue();

    // Maxlength check
    const longLocation = 'a'.repeat(31);
    control.setValue(longLocation);
    expect(control.valid).toBeFalse();
    expect(control.errors?.['maxlength']).toBeTruthy();

    // Valid check
    const validLongLocation = 'a'.repeat(30);
    control.setValue(validLongLocation);
    expect(control.valid).toBeTrue();
  });
});
