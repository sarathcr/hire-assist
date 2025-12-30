import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import {
  CustomFormControlConfig,
  CustomInputTextCalenderConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

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
  @Input() maxDate!: Date;
  @Input() hasDateError!: string;

  public formControl!: FormControl<Date | string | null>;
  public inputTextCalendarConfig!: CustomInputTextCalenderConfig;

  ngOnInit(): void {
    this.inputTextCalendarConfig = this.config as CustomInputTextCalenderConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl<
      Date | string | null
    >;
  }

  public onDateSelect(event: Date): void {
    if (event && this.formControl) {
      this.formControl.setValue(event, { emitEvent: true });
    }
  }

  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
