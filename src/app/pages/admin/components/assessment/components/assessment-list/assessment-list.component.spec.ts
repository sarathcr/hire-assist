import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssessmentListComponent } from './assessment-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AssessmentListComponent', () => {
  let component: AssessmentListComponent;
  let fixture: ComponentFixture<AssessmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentListComponent],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
