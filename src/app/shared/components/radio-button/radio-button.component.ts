import { Component } from '@angular/core';
@Component({
  selector: 'app-radio-button',
  imports: [],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.scss',
})
export class RadioButtonComponent {
  options: string[] = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
}
