/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { InputSelectComponent } from './input-select.component';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { CustomSelectConfig } from '../../../utilities/form.utility';

describe('InputSelectComponent', () => {
  let component: InputSelectComponent;
  let fixture: ComponentFixture<InputSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InputSelectComponent,
        ReactiveFormsModule,
        FloatLabelModule,
        InputTextModule,
        Select,
      ],
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
    }).compileComponents();

    fixture = TestBed.createComponent(InputSelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form control and options in ngOnInit', () => {
    const mockFormGroup = new FormGroup({
      testSelect: new FormControl('A'),
    });

    const mockConfig: CustomSelectConfig = {
      id: 'testSelect',
      labelKey: 'Test Label',
      options: [
        { label: 'Option A', value: 'A' },
        { label: 'Option B', value: 'B' },
      ],
    };

    component.formGroup = mockFormGroup;
    component.config = mockConfig;

    component.ngOnInit();

    expect(component.formControl).toBeTruthy();
    expect(component.formControl.value).toBe('A');
    expect(component.options.length).toBe(2);
  });

  it('should update options on config change in ngOnChanges', () => {
    const initialConfig: CustomSelectConfig = {
      id: 'testSelect',
      labelKey: 'Old Label',
      options: [{ label: 'Old Option', value: 'old' }],
    };

    const newConfig: CustomSelectConfig = {
      id: 'testSelect',
      labelKey: 'New Label',
      options: [{ label: 'New Option', value: 'new' }],
    };

    component.config = initialConfig;
    component.ngOnChanges({
      config: {
        currentValue: newConfig,
        previousValue: initialConfig,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.options.length).toBe(1);
    expect(component.options[0].label).toBe('New Option');
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    (component as any).subs = { unsubscribe: unsubscribeSpy };

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
