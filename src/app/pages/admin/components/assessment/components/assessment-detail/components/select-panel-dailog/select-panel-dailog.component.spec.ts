import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPanelDailogComponent } from './select-panel-dailog.component';

describe('SelectPanelDailogComponent', () => {
  let component: SelectPanelDailogComponent;
  let fixture: ComponentFixture<SelectPanelDailogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectPanelDailogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectPanelDailogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
