import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordChangeComponent } from './reset-password-change.component';

describe('ResetPasswordChangeComponent', () => {
  let component: ResetPasswordChangeComponent;
  let fixture: ComponentFixture<ResetPasswordChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordChangeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
