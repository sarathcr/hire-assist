import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferCandidatePanelModalComponent } from './refer-candidate-panel-modal.component';

describe('ReferCandidatePanelModalComponent', () => {
  let component: ReferCandidatePanelModalComponent;
  let fixture: ComponentFixture<ReferCandidatePanelModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferCandidatePanelModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferCandidatePanelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
