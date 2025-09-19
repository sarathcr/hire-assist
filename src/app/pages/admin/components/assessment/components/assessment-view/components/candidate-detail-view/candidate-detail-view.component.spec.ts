import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateDetailViewComponent } from './candidate-detail-view.component';

describe('CandidateDetailViewComponent', () => {
  let component: CandidateDetailViewComponent;
  let fixture: ComponentFixture<CandidateDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateDetailViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
