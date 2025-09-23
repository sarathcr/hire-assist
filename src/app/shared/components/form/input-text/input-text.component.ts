import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-text',
  imports: [ReactiveFormsModule, InputTextModule, FloatLabelModule],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
})
export class InputTextComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;
  @Input() type!: string | 'text'; // Default to 'text' if not provided
  @Input() values!: string;
  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomTextInputConfig;
  ngOnInit(): void {
    if (!this.config || !this.formGroup) {
      console.warn(
        '[InputTextComponent] Missing required input:',
        !this.config ? 'config' : '',
        !this.formGroup ? 'formGroup' : '',
      );
      return;
    }
    this.inputTextConfig = this.config as CustomTextInputConfig;
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

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
