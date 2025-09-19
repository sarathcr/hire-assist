import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogData } from '../../models/dialog.models';
import { DialogFooterComponent } from './dialog-footer.component';

describe('DialogFooterComponent', () => {
  let component: DialogFooterComponent;
  let fixture: ComponentFixture<DialogFooterComponent>;
  let dialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let dialogConfig: DynamicDialogConfig;

  const testDialogData: DialogData = {
    message: 'Are you sure you want to delete the candidate?',
    isChoice: true,
    cancelButtonText: 'Cancel',
    acceptButtonText: 'submit',
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    dialogConfig = {
      data: testDialogData,
    } as DynamicDialogConfig;

    await TestBed.configureTestingModule({
      imports: [DialogFooterComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: dialogRef },
        { provide: DynamicDialogConfig, useValue: dialogConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize with dialog data', () => {
    expect(component.data).toEqual(dialogConfig.data);
  });
  it('should call close on dialogRef when cancel is called', () => {
    component.onClose();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
  it('should call close on dialogRef when Submit is called', () => {
    component.onSubmit();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
  it('should display correct button texts from config data', () => {
    component.data.isChoice = true;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons[0].textContent).toContain(testDialogData.cancelButtonText);
    expect(buttons[1].textContent).toContain(testDialogData.acceptButtonText);
  });
  it('should display both buttons when isChoice is true', () => {
    component.data.isChoice = true;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(2);
  });
  it('should display only accept button when isChoice is false', () => {
    component.data.isChoice = false;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain(testDialogData.acceptButtonText);
  });
  it('should not display cancel button when isChoice is false', () => {
    component.data.isChoice = false;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain(testDialogData.acceptButtonText);
  });
  it('should handle undefined data ', () => {
    component.data = undefined as unknown as DialogData;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(0);
  });
  it('should handle null data ', () => {
    component.data = undefined as unknown as DialogData;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('app-button');
    expect(buttons.length).toBe(0);
  });
});
