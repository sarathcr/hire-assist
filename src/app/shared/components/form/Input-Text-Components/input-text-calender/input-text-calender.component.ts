import { Component, Input, OnInit } from '@angular/core';
import { BaseFormComponent } from '../../base-form/base-form.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomFormControlConfig, CustomTextInputConfig } from '../../../../utilities/form.utility';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-input-text-calender',
  imports: [FormsModule, ReactiveFormsModule, FloatLabelModule, DatePickerModule],
  templateUrl: './input-text-calender.component.html',
  styleUrl: './input-text-calender.component.scss'
})
export class InputTextCalenderComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomTextInputConfig;

  ngOnInit(): void {
    this.inputTextConfig = this.config as CustomTextInputConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl;

  }

}
