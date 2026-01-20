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
  standalone: true,
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

  @Input() floatLabel = true;

  @Input() showTime = false;
  @Input() maxDate!: Date;
  @Input() hasDateError!: string;

  public formControl!: FormControl<Date | string | null>;
  public inputTextCalendarConfig!: CustomInputTextCalenderConfig;

  ngOnInit(): void {
    if (!this.formGroup || !this.config) {
      return;
    }

    this.inputTextCalendarConfig = this.config as CustomInputTextCalenderConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl<
      Date | string | null
    >;
  }

  public onDateSelect(event: Date): void {
    if (event) {
      this.formControl.setValue(event, { emitEvent: true });
    }
  }
}
