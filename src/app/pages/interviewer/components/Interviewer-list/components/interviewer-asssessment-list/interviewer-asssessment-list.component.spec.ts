import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewerAsssessmentListComponent } from './interviewer-asssessment-list.component';
import { GenericDataSource } from '../../../../../../shared/components/pagination/generic-data-source';

describe('InterviewerAsssessmentListComponent', () => {
  let component: InterviewerAsssessmentListComponent;
  let fixture: ComponentFixture<InterviewerAsssessmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewerAsssessmentListComponent],
      providers: [GenericDataSource],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewerAsssessmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
