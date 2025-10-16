import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import {
  CustomFormControlConfig,
  CustomTextareaConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-textarea',
  imports: [FormsModule, TextareaModule, ReactiveFormsModule, FloatLabelModule],
  templateUrl: './input-textarea.component.html',
  styleUrl: './input-textarea.component.scss',
})
export class InputTextareaComponent
  extends BaseFormComponent
  implements OnInit
{
  public formControl!: FormControl<string>;
  public inputTextAreaConfig!: CustomTextareaConfig;

  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  ngOnInit(): void {
    this.inputTextAreaConfig = this.config as CustomTextareaConfig;
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public Methods
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
    if (!this.formControl.touched) {
      this.formControl.markAsTouched({ onlySelf: true });
    }
    this.formControl.updateValueAndValidity({ onlySelf: true });
  }
}
