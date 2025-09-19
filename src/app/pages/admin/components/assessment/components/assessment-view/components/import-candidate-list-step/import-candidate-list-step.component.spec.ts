import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportCandidateListStepComponent } from './import-candidate-list-step.component';

describe('ImportCandidateListStepComponent', () => {
  let component: ImportCandidateListStepComponent;
  let fixture: ComponentFixture<ImportCandidateListStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportCandidateListStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportCandidateListStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
