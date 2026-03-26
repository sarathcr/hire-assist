import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelect } from 'primeng/multiselect';
import { Subscription } from 'rxjs';
import { Option } from '../../../models/option';
import {
  CustomFormControlConfig,
  CustomSelectConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-multiselect',
  imports: [ReactiveFormsModule, MultiSelect, FloatLabelModule],
  templateUrl: './input-multiselect.component.html',
  styleUrl: './input-multiselect.component.scss',
})
export class InputMultiselectComponent
  extends BaseFormComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;
  @Input() disabled = false;

  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomSelectConfig;
  public items = input<Option[]>();
  public selectedItems = input<Option[]>();
  public placeholder = input();
  public options: Option[] = [];
  public maxSelectedLabels = 3;
  private readonly subs!: Subscription;

  get multiSelectDisplay() {
    const value = this.formControl?.value;
    const count = Array.isArray(value) ? value.length : 0;
    return count > this.maxSelectedLabels ? 'comma' : 'chip';
  }

  constructor() {
    super();
  }

  ngOnInit() {
    this.inputTextConfig = this.config as CustomSelectConfig;
    this.options = (this.config as CustomSelectConfig).options || [];
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
    // Apply disabled state immediately on first render
    if (this.disabled) {
      this.formControl?.disable({ emitEvent: false });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']?.currentValue) {
      this.options = changes['config'].currentValue.options;
      this.formControl = this.formGroup.get(this.config.id) as FormControl;
    }
    // React to disabled input changes
    if (changes['disabled'] !== undefined) {
      if (this.disabled) {
        this.formControl?.disable({ emitEvent: false });
      } else {
        this.formControl?.enable({ emitEvent: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }
}
