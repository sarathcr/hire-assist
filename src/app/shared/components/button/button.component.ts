import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
export type ButtonVariant = 'outlined' | 'text';
@Component({
  selector: 'app-button',
  imports: [ButtonModule, CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  public btnClick = output();
  public buttonLabel = input();
  public buttonSize = input();
  public buttonWidth = input();
  public buttonVariant = input<ButtonVariant>();

  // Public Events
  public onButtonClick(): void {
    this.btnClick.emit();
  }
}
