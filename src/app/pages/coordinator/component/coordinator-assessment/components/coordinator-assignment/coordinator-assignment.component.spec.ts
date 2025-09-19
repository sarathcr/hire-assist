import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordinatorAssignmentComponent } from './coordinator-assignment.component';

describe('CoordinatorAssignmentComponent', () => {
  let component: CoordinatorAssignmentComponent;
  let fixture: ComponentFixture<CoordinatorAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinatorAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinatorAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
