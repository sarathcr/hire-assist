import { Component, Input, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../base-form/base-form.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomFormControlConfig, CustomTextInputConfig } from '../../../../utilities/form.utility';
import { CommonModule } from '@angular/common';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-input-text-iftalabel',
  imports: [

      FormsModule,
      ReactiveFormsModule,
      IftaLabelModule,
      CommonModule,],
  templateUrl: './input-text-iftalabel.component.html',
  styleUrl: './input-text-iftalabel.component.scss'
})
export class InputTextIftalabelComponent extends BaseFormComponent implements OnInit {
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
