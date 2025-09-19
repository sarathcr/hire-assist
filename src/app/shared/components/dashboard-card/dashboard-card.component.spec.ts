import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';

import { DashboardCardComponent } from './dashboard-card.component';

describe('DashboardCardComponent', () => {
  let component: DashboardCardComponent;
  let fixture: ComponentFixture<DashboardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardComponent],
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(
      compiled.querySelector('.dashboard-card__title').textContent,
    ).toContain('Test Title');
  });

  it('should display the count', () => {
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(
      compiled.querySelector('.dashboard-card__count').textContent,
    ).toContain(5);
  });

  it('should display activeCount if greater than 0', () => {
    fixture.componentRef.setInput('activeCount', 3);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const activeEl = compiled.querySelector('.dashboard-card__active');

    expect(activeEl).toBeTruthy();
    expect(activeEl.textContent).toContain(3);
  });

  it('should not display activeCount if zero or less', () => {
    fixture.componentRef.setInput('activeCount', 0);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const activeEl = compiled.querySelector('.dashboard-card__active');

    expect(activeEl).toBeNull();
  });

  it('should display inactiveCount if greater than 0', () => {
    fixture.componentRef.setInput('inactiveCount', 2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const inactiveEl = compiled.querySelector('.dashboard-card__inactive');

    expect(inactiveEl).toBeTruthy();
    expect(inactiveEl.textContent).toContain(2);
  });

  it('should not display inactiveCount if zero or less', () => {
    fixture.componentRef.setInput('inactiveCount', 0);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const inactiveEl = compiled.querySelector('.dashboard-card__inactive');

    expect(inactiveEl).toBeNull();
  });
});
