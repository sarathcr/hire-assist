import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateThankyouComponent } from './candidate-thankyou.component';

describe('CandidateThankyouComponent', () => {
  let component: CandidateThankyouComponent;
  let fixture: ComponentFixture<CandidateThankyouComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateThankyouComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateThankyouComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
