import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { InputTextareaComponent } from './input-textarea.component';

describe('InputTextareaComponent', () => {
  let component: InputTextareaComponent;
  let fixture: ComponentFixture<InputTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InputTextareaComponent,
        ReactiveFormsModule,
        TextareaModule,
        FloatLabelModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputTextareaComponent);
    component = fixture.componentInstance;

    component.config = { id: 'testControl', labelKey: 'Test Label' };
    component.formGroup = new FormGroup({
      testControl: new FormControl(''),
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize formControl and inputTextAreaConfig on ngOnInit', () => {
    component.ngOnInit();

    expect(component.inputTextAreaConfig).toEqual(component.config);
    expect(component.formControl).toBeTruthy();
    expect(component.formControl.value).toBe('');
  });

  it('should update formControl value on onInputChange', () => {
    component.ngOnInit();

    const event = {
      target: { value: 'new value' },
    } as unknown as Event;

    component.onInputChange(event);

    expect(component.formControl.value).toBe('new value');
  });

  it('should reflect changes to dynamicSuffix', () => {
    component.dynamicSuffix = 'Suffix';
    fixture.detectChanges();

    expect(component.dynamicSuffix).toBe('Suffix');
  });
});
