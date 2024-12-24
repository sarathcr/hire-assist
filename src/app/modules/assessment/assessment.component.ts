import { Component, output } from '@angular/core';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';

@Component({
  selector: 'app-assessment',
  imports: [RadioButtonComponent],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent {
  // constructor() {}
  // ngAfterViewInit(): void {
  //   this.requestFullScreenMode();
  // }
  // // Private Events
  // requestFullScreenMode(): void {
  //   const element = document.documentElement;
  //   element
  //     .requestFullscreen()
  //     .then(() => {
  //       console.log('Entered fullscreen mode.');
  //     })
  //     .catch(err => {
  //       console.error('Failed to enter fullscreen mode:', err);
  //     });
  // }
  public selectOption = output();

  public onOptionSelect() {
    this.selectOption.emit();
  }
}
