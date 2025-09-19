import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-interviewer-feedback-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="candidate">
      <div>
        <h2 class="candidate__card-heading"><p-skeleton width="12rem" /></h2>
        <div class="candidate__details">
          <div class="candidate__card">
            <div class="candidate__card-content">
              <div class="candidate__card-info-item">
                <p-skeleton width="10rem" height="1.5rem" />
              </div>
              <div class="candidate__card-info-item">
                <p-skeleton width="10rem" height="1.5rem" />
              </div>
            </div>
          </div>
          <div class="candidate__card-knob">
            <p-skeleton shape="circle" size="4rem" />
            <div class="candidate__knob-label"><p-skeleton width="4rem" /></div>
          </div>
        </div>
      </div>

      <div class="candidate__accordion">
        <h3><p-skeleton width="16rem" /></h3>
        @for (s of skeletonRounds; track s) {
          <div class="candidate__accordion-panel">
            <div class="candidate__accordion-heading">
              <p-skeleton width="10rem" height="1.2rem" />
            </div>
            <div class="candidate__accordion-content">
              <p-skeleton width="100%" height="3rem" />
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './interviewer-feedback.component.scss',
})
export class InterviewerFeedbackSkeletonComponent {
  skeletonRounds = [1, 2, 3, 4, 5];
}
