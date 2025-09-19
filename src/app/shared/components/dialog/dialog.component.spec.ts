import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;
  let mockRef: jasmine.SpyObj<DynamicDialogRef>;
  let mockConfig: DynamicDialogConfig;

  beforeEach(async () => {
    mockRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    mockConfig = {
      data: {
        title: 'Test Dialog Title',
        message: 'This is a test message.',
      },
    };
    await TestBed.configureTestingModule({
      imports: [DialogComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockRef },
        { provide: DynamicDialogConfig, useValue: mockConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load data from config on init', () => {
    expect(component.data.title).toBe('Test Dialog Title');
    expect(component.data.message).toBe('This is a test message.');
  });

  it('should close dialog with false on submit', () => {
    component.onSubmit();
    expect(mockRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog without value on close', () => {
    component.onClose();
    expect(mockRef.close).toHaveBeenCalledWith();
  });

  it('should render title and message in the template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(
      'Test Dialog Title',
    );
    expect(
      compiled.querySelector('.dialog__description')?.textContent,
    ).toContain('This is a test message.');
  });
});
