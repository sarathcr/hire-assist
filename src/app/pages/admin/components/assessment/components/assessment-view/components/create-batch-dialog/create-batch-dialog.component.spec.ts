import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

import { CreateBatchDialogComponent } from './create-batch-dialog.component';

describe('CreateBatchDialogComponent', () => {
  let component: CreateBatchDialogComponent;
  let fixture: ComponentFixture<CreateBatchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBatchDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DynamicDialogRef, useValue: {} },
        { provide: DynamicDialogConfig, useValue: { data: {} } },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set maxDate to end of the day for recruitmentEndDate', () => {
    component.config.data = {
      recruitmentStartDate: '2026-09-15',
      recruitmentEndDate: '2026-09-16',
    };
    component.ngOnInit();

    expect(component.maxDate).toBeTruthy();
    expect(component.maxDate?.getHours()).toBe(23);
    expect(component.maxDate?.getMinutes()).toBe(59);
    expect(component.maxDate?.getSeconds()).toBe(59);
  });

  it('should allow start date today when recruitmentStartDate was yesterday', () => {
    component.config.data = {
      recruitmentStartDate: '2026-09-15',
      recruitmentEndDate: '2026-09-16',
    };
    component.ngOnInit();

    const today = new Date();
    component.fGroup.get('startDate')?.setValue(today);
    expect(component.fGroup.get('startDate')?.hasError('errorMessage')).toBeFalse();
  });
});


