import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateTestComponent } from './candidate-test.component';
import { DialogService } from 'primeng/dynamicdialog';

describe('CandidateTestComponent', () => {
  let component: CandidateTestComponent;
  let fixture: ComponentFixture<CandidateTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateTestComponent],
      providers: [DialogService],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
