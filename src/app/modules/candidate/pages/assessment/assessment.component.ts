import { Component, output } from '@angular/core';
import { RadioButtonComponent } from '../../../../shared/components/radio-button/radio-button.component';

@Component({
  selector: 'app-assessment',
  imports: [RadioButtonComponent],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent {
  public selectOption = output();

  public onOptionSelect() {
    this.selectOption.emit();
  }
}
