import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerSidebarComponent } from './inner-sidebar.component';

describe('InnerSidebarComponent', () => {
  let component: InnerSidebarComponent;
  let fixture: ComponentFixture<InnerSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InnerSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InnerSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
