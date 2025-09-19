import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignBatchDialogComponent } from './assign-batch-dialog.component';

describe('AssignBatchDialogComponent', () => {
  let component: AssignBatchDialogComponent;
  let fixture: ComponentFixture<AssignBatchDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignBatchDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignBatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
