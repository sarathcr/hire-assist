import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Options } from '../../../../pages/candidate/models/candidate-test-question-set.model';

@Component({
  selector: 'app-input-radio',
  imports: [RadioButtonModule, FormsModule],
  templateUrl: './input-radio.component.html',
  styleUrl: './input-radio.component.scss',
})
export class InputRadioComponent {
  @Input() option!: Options;
  @Input() selectedValue!: string | number;
  @Input() groupName!: string;
  @Output() selectedValueChange = new EventEmitter<string | number>();

  onValueChange(value: string | number): void {
    this.selectedValueChange.emit(value);
  }
}
