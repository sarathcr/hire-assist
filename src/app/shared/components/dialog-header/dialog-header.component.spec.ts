import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DialogData } from '../../models/dialog.models';
import { DialogHeaderComponent } from './dialog-header.component';

describe('DialogHeaderComponent', () => {
  let component: DialogHeaderComponent;
  let fixture: ComponentFixture<DialogHeaderComponent>;
  let dialogConfig: DynamicDialogConfig;

  const testDialogData: DialogData = {
    headerTitle: 'Warning',
    warningCount: 1,
    message: `test warning`,
    isChoice: true,
    acceptButtonText: 'Continue',
    cancelButtonText: 'Cancel',
  };

  beforeEach(async () => {
    dialogConfig = {
      data: testDialogData,
    } as DynamicDialogConfig;

    await TestBed.configureTestingModule({
      imports: [DialogHeaderComponent],
      providers: [{ provide: DynamicDialogConfig, useValue: dialogConfig }],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set headerTitle from dialogConfig data', () => {
    expect(component.data).toBe(dialogConfig.data);
  });

  it('should diaplay header with  provided header title', () => {
    component.data.headerTitle = 'Custom Header';
    fixture.detectChanges();

    const headerElement: HTMLElement = fixture.nativeElement.querySelector(
      '.dialog-header__title',
    );
    expect(headerElement).not.toBeNull();
    expect(headerElement.textContent?.trim()).toBe('Custom Header');
  });
  it('shpould display warning count with provided warning count', () => {
    component.data.warningCount = 5;
    fixture.detectChanges();

    const warningCountElement: HTMLElement =
      fixture.nativeElement.querySelector('p-tag');

    expect(warningCountElement).not.toBeNull();
    expect(warningCountElement.textContent?.trim()).toBe(
      'Remaining attempts : 5',
    );
  });

  it('should display the warningCount severity as warn ', () => {
    const tag = fixture.nativeElement.querySelector('p-tag');
    expect(tag.getAttribute('ng-reflect-severity')).toBe('warn');
  });
  it('should not display the header and warning count when data is not provided', () => {
    component.data = null as unknown as DialogData; // Simulate no data
    fixture.detectChanges(); // Trigger change detection

    const headerElement: HTMLElement = fixture.nativeElement.querySelector(
      '.dialog-header__title',
    );
    const warningCountElement: HTMLElement =
      fixture.nativeElement.querySelector('p-tag');

    expect(headerElement).toBeNull(); // Header should not be present
    expect(warningCountElement).toBeNull(); // Warning count should not be present
  });
  it('should not display the headertitle when header is null', () => {
    component.data.headerTitle = null as unknown as string; // Simulate zero warning count
    fixture.detectChanges(); // Trigger change detection

    const titleElement = fixture.nativeElement.querySelector(
      '.dialog-header__title',
    );
    expect(titleElement?.textContent?.trim()).toBe(''); // Warning count should not be present
  });
  it('should display empty warning count when warningCount is null', () => {
    component.data.warningCount = null as unknown as number;
    fixture.detectChanges();

    const warningCountElement: HTMLElement =
      fixture.nativeElement.querySelector('p-tag');
    expect(warningCountElement).not.toBeNull();
    expect(warningCountElement.textContent?.trim()).toBe(
      'Remaining attempts :',
    );
  });
});
