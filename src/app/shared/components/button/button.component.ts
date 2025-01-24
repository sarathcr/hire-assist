import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public btnClick = output<any>();
  public buttonLabel = input();
  public buttonSize = input();
  public buttonWidth = input();
  public isLoading = input();
  public buttonVariant = input<ButtonVariant>();
  public buttonConfig = input<ButtonConfig>();
  public buttonSeverity = input<Severity>();

  @Input() saveDisabled = false;
  @Input() btnRounded = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // Public Events
  public onButtonClick(buttonId?: number): void {
    if (!this.saveDisabled) {
      this.btnClick.emit(buttonId ?? null);
    }
  }
}
