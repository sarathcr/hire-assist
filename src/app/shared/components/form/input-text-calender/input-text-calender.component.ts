import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { BaseFormComponent } from '../base-form/base-form.component';
import {
  CustomFormControlConfig,
  CustomInputTextCalenderConfig,
} from '../../../utilities/form.utility';

@Component({
  selector: 'app-input-text-calender',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FloatLabelModule,
    DatePickerModule,
  ],
  templateUrl: './input-text-calender.component.html',
  styleUrl: './input-text-calender.component.scss',
})
export class InputTextCalenderComponent
  extends BaseFormComponent
  implements OnInit
{
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;
  @Input() showTime = false;

  public formControl!: FormControl<string>;
  public inputTextCalendarConfig!: CustomInputTextCalenderConfig;

  ngOnInit(): void {
    this.inputTextCalendarConfig = this.config as CustomInputTextCalenderConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
