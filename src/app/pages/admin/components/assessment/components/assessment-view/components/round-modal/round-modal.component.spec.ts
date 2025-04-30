import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundModalComponent } from './round-modal.component';

describe('RoundModalComponent', () => {
  let component: RoundModalComponent;
  let fixture: ComponentFixture<RoundModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoundModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
