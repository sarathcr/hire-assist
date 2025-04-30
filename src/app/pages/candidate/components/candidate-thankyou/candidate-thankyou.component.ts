import { Component } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-candidate-thankyou',
  imports: [ButtonComponent],
  templateUrl: './candidate-thankyou.component.html',
  styleUrl: './candidate-thankyou.component.scss',
})
export class CandidateThankyouComponent {
  constructor(private router: Router) {}

  // Public Events
  public onGoBackClick() {
    this.router.navigate(['/candidate']);
  }
}
