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
  data: ['candidate-1', 'candidate-2'],
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

  it('should initialize selectedCandidateIds from config', () => {
    expect(component.selectedCandidateIds).toEqual([
      'candidate-1',
      'candidate-2',
    ]);
  });

  it('should close dialog with form data if form is valid', () => {
    component.fGroup.get('scheduleDate')?.setValue(new Date()); // today
    component.onSchedule();
    expect(mockDialogRef.close).toHaveBeenCalledWith(component.fGroup.value);
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
      errorMessage: 'Schedule Date must be today or later.',
    });
  }));

  it("should clear validation error for today's date", fakeAsync(() => {
    const control = component.fGroup.get('scheduleDate');
    control?.setValue(new Date());
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
    expect(component.selectedCandidateIds).toEqual([]);
  });

  it('should remove a candidate from the list', () => {
    component.selectedCandidateIds = ['candidate-1', 'candidate-2'];
    component.removeCandidate(0);
    expect(component.selectedCandidateIds).toEqual(['candidate-2']);
  });

  it('should add date validation subscription to subscriptionList', fakeAsync(() => {
    const initialLength = (component as any).subscriptionList.length;

    if (!component.fGroup.contains('scheduleDate')) {
      component.fGroup.addControl('scheduleDate', new FormControl());
    }

    component['setupDateValidation']();
    component.fGroup.get('scheduleDate')?.setValue(new Date());
    tick();

    expect((component as any).subscriptionList.length).toBeGreaterThan(
      initialLength,
    );
  }));
});
