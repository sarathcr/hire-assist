import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
  CustomFormControlConfig,
  CustomToggleSwitchConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-toggle-switch',
  imports: [FormsModule, ToggleSwitch, ReactiveFormsModule, FloatLabelModule],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss',
})
export class ToggleSwitchComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() dynamicSuffix!: string;

  public formControl!: FormControl<string | boolean>;
  public customToggleSwitchConfig!: CustomToggleSwitchConfig;

  ngOnInit(): void {
    this.customToggleSwitchConfig = this.config as CustomToggleSwitchConfig;
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
    if (this.formControl.value == null) this.formControl.setValue(false);
  }

  // Public Methods
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
