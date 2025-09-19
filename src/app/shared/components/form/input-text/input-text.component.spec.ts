import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomFormControlConfig } from '../../../utilities/form.utility';
import { InputTextComponent } from './input-text.component';

describe('InputTextComponent', () => {
  let component: InputTextComponent;
  let fixture: ComponentFixture<InputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextComponent);
    component = fixture.componentInstance;

    component.config = { id: 'testLabel' } as CustomFormControlConfig;
    component.formGroup = new FormGroup({
      testLabel: new FormControl('Inital value'),
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize formControl and inputTextConfig on ngOnInit', () => {
    expect(component.formControl).toBeDefined();
    expect(component.inputTextConfig).toBeDefined();
    expect(component.formControl.value).toBe('Inital value');
    expect(component.inputTextConfig.id).toBe('testLabel');
  });

  it('should update formControl value on input change', () => {
    const event = { target: { value: 'new value' } } as unknown as Event;
    component.onInputChange(event);
    expect(component.formControl.value).toBe('new value');
  });
  it('should call console.warn if config or formGroup is missing', () => {
    spyOn(console, 'warn');
    component.config = undefined as unknown as CustomFormControlConfig;
    component.formGroup = undefined as unknown as FormGroup;
    component.ngOnInit();
    expect(console.warn).toHaveBeenCalledWith(
      '[InputTextComponent] Missing required input:',
      'config',
      'formGroup',
    );
  });
  it('should apply the passed type to the input element', () => {
    component.formGroup = new FormGroup({
      testLabel: new FormControl('value'),
    });
    component.type = 'text';

    component.ngOnInit();
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('text');
  });
  it('should set type as text when no type is provided', () => {
    component.formGroup = new FormGroup({
      testLabel: new FormControl('value'),
    });
    component.type = undefined as unknown as string;
    component.ngOnInit();
    fixture.detectChanges();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('text');
  });
});
