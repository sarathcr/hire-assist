import { Component, output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-card',
  imports: [ButtonComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  public startTest = output();

  // Public Events
  public startAssessment() {
    this.startTest.emit();
  }
}
