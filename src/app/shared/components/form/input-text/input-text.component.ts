import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { KeyFilterModule } from 'primeng/keyfilter';
import {
  CustomFormControlConfig,
  CustomTextInputConfig,
} from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-text',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, FloatLabelModule, KeyFilterModule, CommonModule, NgClass],
  templateUrl: './input-text.component.html',
  styleUrl: './input-text.component.scss',
})
export class InputTextComponent extends BaseFormComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() config!: CustomFormControlConfig;
  @Input() type = 'text';
  @Input() values!: string;

  @Input() floatLabel = true;

  public formControl!: FormControl<string>;
  public inputTextConfig!: CustomTextInputConfig;

  public isMasked = true;
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

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
    const input = event.target as HTMLInputElement;
    let val = input.value;

    if (this.inputTextConfig?.isMaskable) {
      // Clean non-numeric
      val = val.replace(/\D/g, '');
      // Limit to 12 (Aadhaar standard)
      if (val.length > 12) val = val.substring(0, 12);
      
      // Update control with CLEAN value
      this.formControl.setValue(val);
      
      // Update the actual input display if unmasked
      if (!this.isMasked) {
        input.value = this.formatAadhaar(val);
      }
    } else {
      this.formControl.setValue(val);
    }

    if (!this.formControl.touched) {
      this.formControl.markAsTouched({ onlySelf: true });
    }

    this.formControl.updateValueAndValidity({ onlySelf: true });
  }

  public get displayValue(): string {
    const val = this.formControl?.value || '';
    if (this.inputTextConfig?.isMaskable && val) {
      if (this.isMasked) {
        return this.maskAadhaar(val);
      }
      return this.formatAadhaar(val);
    }
    return val;
  }

  public toggleMask(): void {
    this.isMasked = !this.isMasked;
    if (!this.isMasked) {
      this.focusInput();
      // Ensure the input has the formatted value immediately
      if (this.inputField?.nativeElement) {
        this.inputField.nativeElement.value = this.formatAadhaar(this.formControl.value);
      }
    }
  }

  private focusInput(): void {
    const el = this.inputField?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.focus();
        // Set cursor to end
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    }
  }

  private maskAadhaar(val: string): string {
    if (!val) return '';
    const str = String(val).replace(/\s/g, '');
    const maskedPart = 'X'.repeat(Math.max(0, str.length - 4));
    const last4 = str.slice(-4);
    const combined = maskedPart.substring(0, 8) + last4; // Ensure 8 Xs max for display
    return combined.replace(/(.{4})/g, '$1 ').trim();
  }

  private formatAadhaar(val: string): string {
    if (!val) return '';
    const str = String(val).replace(/\s/g, '');
    return str.replace(/(.{4})/g, '$1 ').trim();
  }
}
