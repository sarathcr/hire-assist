import { Component, Input, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
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
  @Input() maxDate: Date | null | undefined;
  @Input() minDate: Date | null | undefined;
  @Input() hasDateError!: string;

  public formControl!: FormControl<Date | string | null>;
  public inputTextCalendarConfig!: CustomInputTextCalenderConfig;

  private isTouchMoved = false;
  private cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.formGroup || !this.config) {
      return;
    }

    this.inputTextCalendarConfig = this.config as CustomInputTextCalenderConfig;

    this.formControl = this.formGroup.get(this.config.id) as FormControl<
      Date | string | null
    >;
  }

  get isDisabled(): boolean {
    return !!(
      this.formControl?.disabled ||
      this.formGroup?.get(this.config?.id)?.disabled
    );
  }

  onDatePickerClick(event: MouseEvent | Event, datePicker: DatePicker): void {
    if (this.isDisabled) {
      return;
    }
    const target = event.target as HTMLElement;
    if (
      target?.closest('.p-datepicker-clear-icon') ||
      target?.closest('.p-datepicker-dropdown') ||
      target?.closest('.p-datepicker-trigger')
    ) {
      return;
    }
    this.showDatePicker(datePicker);
  }

  onTouchStart(): void {
    this.isTouchMoved = false;
  }

  onTouchMove(): void {
    this.isTouchMoved = true;
  }

  onTouchEnd(event: TouchEvent, datePicker: DatePicker): void {
    if (this.isTouchMoved || this.isDisabled) {
      return;
    }
    const target = event.target as HTMLElement;
    if (
      target?.closest('.p-datepicker-clear-icon') ||
      target?.closest('.p-datepicker-dropdown') ||
      target?.closest('.p-datepicker-trigger')
    ) {
      return;
    }
    this.showDatePicker(datePicker);
  }

  private showDatePicker(datePicker: DatePicker): void {
    if (!datePicker || this.isDisabled) {
      return;
    }

    if (!(datePicker as any)['_outsideClickPatched']) {
      (datePicker as any)['_outsideClickPatched'] = true;
      const originalIsOutsideClicked = datePicker.isOutsideClicked.bind(datePicker);
      datePicker.isOutsideClicked = (event: any) => {
        const target = event?.target as HTMLElement;
        if (target) {
          if (
            target.closest('.p-floatlabel') ||
            target.closest('.input-text-calender')
          ) {
            return false;
          }
        }
        return originalIsOutsideClicked(event);
      };
    }

    if (!datePicker.overlayVisible) {
      datePicker.showOverlay();
      if (datePicker.overlay) {
        datePicker.overlay.style.display = 'block';
        datePicker.overlay.style.visibility = 'visible';
      }
      this.cd?.markForCheck();
    }
  }
}
