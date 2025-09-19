import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelDialogComponent } from './panel-dialog.component';

describe('PanelDialogComponent', () => {
  let component: PanelDialogComponent;
  let fixture: ComponentFixture<PanelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
