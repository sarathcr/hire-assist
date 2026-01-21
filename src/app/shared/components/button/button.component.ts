import { CommonModule } from '@angular/common';
import { Component, Input, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'outlined' | 'text';
export type Severity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'help'
  | 'primary'
  | 'secondary'
  | 'contrast'
  | null
  | undefined;
export interface ButtonConfig {
  id: number;
  label: string;
}

@Component({
  selector: 'app-button',
  imports: [ButtonModule, CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  public btnClick = output<number | null>();
  public buttonLabel = input<string>();
  public icon = input<string>();
  public buttonSize = input<ButtonSize>('large');
  public buttonWidth = input();
  public isLoading = input();
  public buttonVariant = input<ButtonVariant>();
  public buttonConfig = input<ButtonConfig>();
  public buttonSeverity = input<Severity>();

  @Input() disabled = false;
  @Input() btnRounded = false;

  // Public Events
  public onButtonClick(buttonId?: number): void {
    if (!this.disabled) {
      this.btnClick.emit(buttonId ?? null);
    }
  }
}
