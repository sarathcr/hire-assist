import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';

import { BaseFormComponent } from '../base-form/base-form.component';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';

@Component({
  selector: 'app-input-text-iftalabel',
  imports: [FormsModule, ReactiveFormsModule, IftaLabelModule, CommonModule],
  templateUrl: './input-text-iftalabel.component.html',
  styleUrl: './input-text-iftalabel.component.scss',
})
export class InputTextIftalabelComponent
  extends BaseFormComponent
  implements OnInit
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;

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
