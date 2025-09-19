import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskBatchAssignmentComponent } from './frontdesk-batch-assignment.component';

describe('FrontdeskBatchAssignmentComponent', () => {
  let component: FrontdeskBatchAssignmentComponent;
  let fixture: ComponentFixture<FrontdeskBatchAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskBatchAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskBatchAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
