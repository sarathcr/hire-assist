import { Component } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-thank-you',
  imports: [ButtonComponent],
  templateUrl: './thank-you.component.html',
  styleUrl: './thank-you.component.scss',
})
export class ThankYouComponent {
  constructor(private router: Router) {}

  // Public Events
  public onGoBackClick() {
    this.router.navigate(['/candidate']);
  }
}
