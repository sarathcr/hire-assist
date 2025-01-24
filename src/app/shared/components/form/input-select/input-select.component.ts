import {
  Component,
  Input,
  OnChanges,
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
import { SelectModule, Select } from 'primeng/select';
import {
  CustomFormControlConfig,
  CustomSelectConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';
import { InputTextModule } from 'primeng/inputtext';

export interface Options {
  name: string;
  code: string;
}
@Component({
  selector: 'app-input-select',
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

//extends BaseFormComponent
//, OnChanges
export class InputSelectComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  @Input() selectOptions: Options[] | undefined;
  selectedData: Options | undefined;
  public formControl!: FormControl<string>;
  public selectConfig!: CustomSelectConfig;

  ngOnInit(): void {
    this.selectConfig = this.config as CustomSelectConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
