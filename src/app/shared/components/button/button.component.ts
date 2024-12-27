import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-button',
  imports: [MatButtonModule,CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  public btnClick = output();
  public buttonLabel = input();
  public buttonWidth = input();

  // Public Events
  public onButtonClick(): void {
    this.btnClick.emit();
  }
}
