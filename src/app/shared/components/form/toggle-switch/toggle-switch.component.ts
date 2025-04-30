import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { BaseFormComponent } from '../base-form/base-form.component';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
  CustomToggleSwitchConfig,
} from '../../../utilities/form.utility';

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

  public formControl!: FormControl<string>;
  public customToggleSwitchConfig!: CustomToggleSwitchConfig;

  ngOnInit(): void {
    this.customToggleSwitchConfig = this.config as CustomTextInputConfig;
    this.formControl = this.formGroup.get(this.config.id) as FormControl;
  }

  // Public Methods
  public onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue: string = inputElement.value;
    this.formControl.setValue(inputValue);
  }
}
