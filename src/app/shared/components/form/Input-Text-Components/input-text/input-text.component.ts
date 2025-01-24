import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { BaseFormComponent } from '../../base-form/base-form.component';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
} from '../../../../utilities/form.utility';

@Component({
  selector: 'app-input-text',
  imports: [
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
})
export class InputTextComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomTextInputConfig;

  ngOnInit(): void {
    this.inputTextConfig = this.config as CustomTextInputConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
