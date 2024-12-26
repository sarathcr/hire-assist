import { Component } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
@Component({
  selector: 'app-radio-button',
  imports: [MatRadioModule],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.scss',
})
export class RadioButtonComponent {
  options: string[] = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
}
