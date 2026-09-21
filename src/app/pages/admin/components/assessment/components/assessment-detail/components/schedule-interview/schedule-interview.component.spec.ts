/* eslint-disable @typescript-eslint/no-explicit-any */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ScheduleInterviewComponent } from './schedule-interview.component';

// Mock data
const mockDialogRef = {
  close: jasmine.createSpy('close'),
};

const mockDialogConfig = {
  data: {
    candidates: [
      { id: 'candidate-1', name: 'Candidate One' },
      { id: 'candidate-2', name: 'Candidate Two' }
    ],
    onSubmit: jasmine.createSpy('onSubmit')
  },
};

describe('ScheduleInterviewComponent', () => {
  let component: ScheduleInterviewComponent;
  let fixture: ComponentFixture<ScheduleInterviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ScheduleInterviewComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDialogRef },
        { provide: DynamicDialogConfig, useValue: mockDialogConfig },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleInterviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockDialogRef.close.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selectedCandidates from config', () => {
    expect(component.selectedCandidates).toEqual([
      { id: 'candidate-1', name: 'Candidate One' },
      { id: 'candidate-2', name: 'Candidate Two' }
    ]);
  });

  it('should call onSubmitCallback with form data if form is valid', () => {
    component.fGroup.get('scheduleDate')?.setValue(new Date()); // today
    component.onSchedule();
    expect(mockDialogConfig.data.onSubmit).toHaveBeenCalledWith({
      ...component.fGroup.value,
      candidateIds: ['candidate-1', 'candidate-2']
    });
  });

  it('should NOT close dialog if form is invalid', () => {
    component.fGroup
      .get('scheduleDate')
      ?.setErrors({ errorMessage: 'Invalid date' });
    component.onSchedule();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close dialog without value on cancel', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should mark form as touched on schedule click', () => {
    const markAllAsTouchedSpy = spyOn(component.fGroup, 'markAllAsTouched');
    component.onSchedule();
    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should set validation error for past date', fakeAsync(() => {
    const control = component.fGroup.get('scheduleDate');
    control?.setValue(new Date('2000-01-01'));
    tick();
    expect(control?.errors).toEqual({
      errorMessage: 'Interview must be scheduled at least 30 minutes from now.',
    });
  }));

  it("should clear validation error for future date beyond buffer", fakeAsync(() => {
    const control = component.fGroup.get('scheduleDate');
    control?.setValue(new Date(Date.now() + 35 * 60 * 1000));
    tick();
    expect(control?.errors).toBeNull();
  }));

  it('should render candidate chips in template', () => {
    const chips = fixture.debugElement.queryAll(By.css('p-chip'));
    expect(chips.length).toBe(2);
  });

  it('should handle null config.data gracefully', () => {
    component.config.data = null as any;
    component.ngOnInit();
    expect(component.selectedCandidates).toEqual([]);
  });

  it('should remove a candidate from the list', () => {
    component.selectedCandidates = [
      { id: 'candidate-1', name: 'Candidate One' },
      { id: 'candidate-2', name: 'Candidate Two' }
    ];
    component.removeCandidate(0);
    expect(component.selectedCandidates).toEqual([
      { id: 'candidate-2', name: 'Candidate Two' }
    ]);
  });

  it('should add date validation subscription to subscriptionList', fakeAsync(() => {
    const initialLength = (component as any).subscriptionList.length;

    if (!component.fGroup.contains('scheduleDate')) {
      component.fGroup.addControl('scheduleDate', new FormControl());
    }

    (component as any)['setupDateValidation']();
    component.fGroup.get('scheduleDate')?.setValue(new Date());
    tick();

    expect((component as any).subscriptionList.length).toBeGreaterThan(
      initialLength,
    );
  }));

  it('should validate correctly with custom buffer minutes', fakeAsync(() => {
    const scheduleControl = component.fGroup.get('scheduleDate');
    const bufferControl = component.fGroup.get('bufferMinutes');

    // Set buffer to 10 minutes
    bufferControl?.setValue(10);
    
    // 15 minutes from now should be valid (since buffer is 10)
    scheduleControl?.setValue(new Date(Date.now() + 15 * 60 * 1000));
    tick();
    expect(scheduleControl?.errors).toBeNull();

    // 5 minutes from now should be invalid
    scheduleControl?.setValue(new Date(Date.now() + 5 * 60 * 1000));
    tick();
    expect(scheduleControl?.errors).toEqual({
      errorMessage: 'Interview must be scheduled at least 10 minutes from now.',
    });
  }));

  it('should validate bufferMinutes boundary constraints (min 1, max 1440, integer pattern)', () => {
    const bufferControl = component.fGroup.get('bufferMinutes');

    // Default value (30) should be valid
    expect(bufferControl?.valid).toBeTrue();

    // Boundary values (1 and 1440) should be valid
    bufferControl?.setValue(1);
    expect(bufferControl?.valid).toBeTrue();

    bufferControl?.setValue(1440);
    expect(bufferControl?.valid).toBeTrue();

    // Less than 1 should be invalid
    bufferControl?.setValue(0);
    expect(bufferControl?.hasError('min')).toBeTrue();

    bufferControl?.setValue(-5);
    expect(bufferControl?.hasError('min')).toBeTrue();

    // Greater than 1440 should be invalid
    bufferControl?.setValue(1441);
    expect(bufferControl?.hasError('max')).toBeTrue();

    // Decimals / floats should be invalid
    bufferControl?.setValue('10.5');
    expect(bufferControl?.hasError('pattern')).toBeTrue();

    // Empty / null should be invalid
    bufferControl?.setValue(null);
    expect(bufferControl?.hasError('required')).toBeTrue();
  });

  it('should format minutes to hours in brackets correctly when greater than 60 minutes', () => {
    expect(component.formatMinutesToHours(30)).toBe('');
    expect(component.formatMinutesToHours(60)).toBe('');
    expect(component.formatMinutesToHours(90)).toBe('(1 hour 30 mins)');
    expect(component.formatMinutesToHours(120)).toBe('(2 hours)');
    expect(component.formatMinutesToHours(150)).toBe('(2 hours 30 mins)');
    expect(component.formatMinutesToHours(1440)).toBe('(24 hours)');
  });

  it('should return bufferHoursText only when bufferMinutes > 60', () => {
    const bufferControl = component.fGroup.get('bufferMinutes');

    bufferControl?.setValue(30);
    expect(component.bufferHoursText).toBe('');

    bufferControl?.setValue(90);
    expect(component.bufferHoursText).toBe('(1 hour 30 mins)');

    bufferControl?.setValue(120);
    expect(component.bufferHoursText).toBe('(2 hours)');
  });

  it('should include hour in brackets in date validation error message when buffer > 60', fakeAsync(() => {
    const scheduleControl = component.fGroup.get('scheduleDate');
    const bufferControl = component.fGroup.get('bufferMinutes');

    bufferControl?.setValue(90);
    // 30 minutes from now should be invalid (since buffer is 90 mins)
    scheduleControl?.setValue(new Date(Date.now() + 30 * 60 * 1000));
    tick();

    expect(scheduleControl?.errors).toEqual({
      errorMessage: 'Interview must be scheduled at least 90 minutes (1 hour 30 mins) from now.',
    });
  }));
});
