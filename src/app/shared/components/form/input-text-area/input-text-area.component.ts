import { Component, Input, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  CustomFormControlConfig,
  CustomTextareaConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-input-text-area',
  imports: [FormsModule, TextareaModule, ReactiveFormsModule, FloatLabelModule],
  templateUrl: './input-text-area.component.html',
  styleUrl: './input-text-area.component.scss',
})
export class InputTextAreaComponent
  extends BaseFormComponent
  implements OnInit
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  public formControl!: FormControl<string>;
  public inputTextAreaConfig!: CustomTextareaConfig;

  ngOnInit(): void {
    this.inputTextAreaConfig = this.config as CustomTextareaConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
