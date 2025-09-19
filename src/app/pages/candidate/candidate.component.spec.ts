import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidateComponent } from './candidate.component';
import { DialogService } from 'primeng/dynamicdialog';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CandidateComponent', () => {
  let component: CandidateComponent;
  let fixture: ComponentFixture<CandidateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateComponent],
      providers: [DialogService, provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
