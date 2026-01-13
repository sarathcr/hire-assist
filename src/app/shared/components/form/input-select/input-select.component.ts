import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
  CustomFormControlConfig,
  CustomSelectConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';
import { Subscription } from 'rxjs';
import { Option } from '../../../models/option';

export interface Options {
  name: string;
  code: string;
}

@Component({
  selector: 'app-input-select',
  standalone: true, // Assuming standalone based on imports
  imports: [
    Select,
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './input-select.component.html',
  styleUrl: './input-select.component.scss',
})
export class InputSelectComponent
  extends BaseFormComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;
  @Input() selectOptions: Options[] | undefined;
  @Input() selectedData: string | undefined;
  @Input() showClear = true;

  // Added to support the toggle, defaults to true to maintain existing behavior
  @Input() floatLabel = true;

  public formControl!: FormControl<string>;
  public selectConfig!: CustomSelectConfig;
  public options: Option[] = [];

  private subs!: Subscription;

  ngOnInit(): void {
    this.selectConfig = this.config as CustomSelectConfig;
    this.options = (this.config as CustomSelectConfig).options || [];
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']?.currentValue) {
      const newConfig = changes['config'].currentValue as CustomSelectConfig;
      this.options = newConfig.options || [];
    }
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }
}
