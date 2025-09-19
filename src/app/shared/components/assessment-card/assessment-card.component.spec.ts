/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';
import { Assessment } from '../../../pages/admin/models/assessment.model';
import { AssessmentCardComponent } from './assessment-card.component';

describe('AssessmentCardComponent', () => {
  let component: AssessmentCardComponent;
  let fixture: ComponentFixture<AssessmentCardComponent>;

  const mockData: Assessment = {
    id: 1,
    name: 'Test Assessment',
    description: 'Test Description',
    statusId: 1,
    startDateTime: '2023-05-01T00:00:00Z',
    endDateTime: '2023-05-31T23:59:59Z',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: '',
    activeRoundsPercentage: 45,
    rounds: [{ roundId: 1, roundName: 'Round 1', roundStatus: 'ACTIVE' }],
    users: [{ userId: 'user1', role: 'admin' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set action items on init', () => {
    expect(component.actionItems.length).toBeGreaterThan(0);
    const labels = component.actionItems.map((item: MenuItem) => item.label);
    expect(labels).toContain('Edit');
    expect(labels).toContain('Duplicate');
    expect(labels).toContain('Delete');
    expect(labels).toContain('Schedule');
  });

  it('should emit edit event', () => {
    spyOn(component.edit, 'emit');
    (component as any).handleActionClick(
      { originalEvent: new Event('click') } as any,
      'edit',
    );
    expect(component.edit.emit).toHaveBeenCalledWith(mockData);
  });

  it('should emit duplicate event', () => {
    spyOn(component.duplicate, 'emit');
    (component as any).handleActionClick(
      { originalEvent: new Event('click') } as any,
      'duplicate',
    );
    expect(component.duplicate.emit).toHaveBeenCalledWith(mockData);
  });

  it('should emit delete event', () => {
    spyOn(component.delete, 'emit');
    (component as any).handleActionClick(
      { originalEvent: new Event('click') } as any,
      'delete',
    );
    expect(component.delete.emit).toHaveBeenCalledWith(mockData.id!);
  });

  it('should emit schedule event', () => {
    spyOn(component.schedule, 'emit');
    (component as any).handleActionClick(
      { originalEvent: new Event('click') } as any,
      'schedule',
    );
    expect(component.schedule.emit).toHaveBeenCalledWith(mockData);
  });

  it('should return correct progress color', () => {
    expect(component.getProgressColor(95)).toBe('#16a34a');
    expect(component.getProgressColor(80)).toBe('#f97316');
    expect(component.getProgressColor(50)).toBe('');
  });

  it('should return last updated info from private getLastUpdatedInfo()', () => {
    const mockDataWithUpdate: Assessment = {
      ...mockData,
      updatedAt: new Date(
        new Date().setDate(new Date().getDate() - 2),
      ).toISOString(),
    };

    const info = (component as any).getLastUpdatedInfo(mockDataWithUpdate);
    expect(info).toBe('Last updated 2 days ago');
  });

  it('should not emit delete if id is not present', () => {
    spyOn(component.delete, 'emit');
    const dataWithoutId = { ...mockData, id: undefined };
    fixture.componentRef.setInput('data', dataWithoutId);
    (component as any).handleActionClick(
      { originalEvent: new Event('click') },
      'delete',
    );
    expect(component.delete.emit).not.toHaveBeenCalled();
  });

  it('should hide toggle button when showToggleButton is false', () => {
    fixture.componentRef.setInput('showToggleButton', false);
    fixture.detectChanges();
    const speeddial = fixture.nativeElement.querySelector('p-speeddial');
    expect(speeddial).toBeNull();
  });
  it('should return correct days difference from getDaysDifference()', () => {
    const from = new Date();
    const to = new Date(new Date().setDate(from.getDate() + 3));
    const diff = (component as any).getDaysDifference(from, to);
    expect(diff).toBe(3);
  });
  it('should return correct strings from formatDateDifference()', () => {
    const format = (component as any).formatDateDifference.bind(component);
    expect(format(0, true)).toBe('Updated today');
    expect(format(0, false)).toBe('Created today');
    expect(format(1, true)).toBe('Last updated 1 day ago');
    expect(format(730, false)).toBe('Created 2 years ago');
  });
  it('should stop event propagation in onActionButtonClick()', () => {
    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'stopPropagation');

    fixture.componentRef.setInput('data', mockData);
    component.onActionButtonClick(mockEvent, () => {});
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
  it('should call toggle and stop event propagation in togglePopover()', () => {
    const toggleSpy = jasmine.createSpy('toggle');
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.togglePopover({ toggle: toggleSpy }, event);
    expect(toggleSpy).toHaveBeenCalledWith(event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should return null for parseDate when input is null or sentinel date', () => {
    const parse = (component as any).parseDate.bind(component);
    expect(parse(null)).toBeNull();
    expect(parse('0001-01-01T00:00:00')).toBeNull();
  });

  it('should disable action buttons if data is inactive or expired', () => {
    const inactiveData = { ...mockData, isActive: false };
    fixture.componentRef.setInput('data', inactiveData);
    fixture.detectChanges();
    // Add logic to check disabled states or missing elements
  });
  it('should handle empty action items gracefully', () => {
    component.actionItems = [];
    fixture.detectChanges();
    const actionButtons = fixture.nativeElement.querySelectorAll(
      '.p-speeddial-action',
    );
    expect(actionButtons.length).toBe(0);
  });

  it('should not throw errors when no rounds are present', () => {
    const dataWithoutRounds = { ...mockData, rounds: [] };
    fixture.componentRef.setInput('data', dataWithoutRounds);
    fixture.detectChanges();
    expect(() => component.getProgressColor(50)).not.toThrow();
  });
});
