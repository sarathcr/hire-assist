import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInterviewerPanelDialogComponent } from './add-interviewer-panel-dialog.component';

describe('AddInterviewerPanelDialogComponent', () => {
  let component: AddInterviewerPanelDialogComponent;
  let fixture: ComponentFixture<AddInterviewerPanelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddInterviewerPanelDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddInterviewerPanelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
