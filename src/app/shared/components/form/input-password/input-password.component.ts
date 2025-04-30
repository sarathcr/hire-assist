import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-password',
  imports: [
    InputTextModule,
    FloatLabelModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
  ],
  templateUrl: './input-password.component.html',
  styleUrl: './input-password.component.scss',
})
export class InputPasswordComponent
  extends BaseFormComponent
  implements OnInit
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomTextInputConfig;

  ngOnInit(): void {
    this.inputTextConfig = this.config as CustomTextInputConfig;
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public Methods
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
