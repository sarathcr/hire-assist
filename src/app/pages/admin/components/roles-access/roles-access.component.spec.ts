import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesAccessComponent } from './roles-access.component';

describe('RolesAccessComponent', () => {
  let component: RolesAccessComponent;
  let fixture: ComponentFixture<RolesAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesAccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
