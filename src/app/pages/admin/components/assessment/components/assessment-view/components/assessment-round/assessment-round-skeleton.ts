import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assessment-round-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="assessment-round">
      <div class="assessment-round__section">
        <div class="assessment-round__section-header">
          <h2 class="assessment-round__title app-title">
            Manage Interview Rounds
          </h2>
          <p class="assessment-round__description">
            Select rounds from the list below to assign to your recruitment.
          </p>
        </div>
        <div class="assessment-round_field__wrapper">
          <p-skeleton
            class="assessment-round__field assessment-round__field-skeleton"
            height="2rem"
          />
          <div class="assessment-round__action-button">
            <p-skeleton width="6rem" height="2rem" />
          </div>
        </div>
        <p class="assessment-round__description">
          Selected rounds for this recruitment
        </p>
        <div class="assessment-round__selected-rounds-preview">
          @for (i of selectedPills; track i) {
            <p-skeleton width="6rem" height="2rem" />
          }
        </div>
      </div>

      <div class="assessment-round__section">
        <div class="assessment-round__section-header">
          <h2 class="assessment-round__title app-title">Create new round</h2>
          <p class="assessment-round__description">
            Create a new custom round and assign to your assessment
          </p>
        </div>

        <div class="assessment-round__field-skeleton">
          <p-skeleton width="100%" height="2rem" />
        </div>

        <div class="assessment-round__field-skeleton">
          <p-skeleton width="100%" height="2rem" />
        </div>

        <div class="assessment-round__action-button_create">
          <p-skeleton width="4rem" height="2rem" />
        </div>
      </div>

      <div class="assessment-round__section">
        <div class="assessment-round__section-header">
          <h2 class="assessment-round__title app-title">
            Reorder the selected rounds
          </h2>
          <p class="assessment-round__description">
            Arrange the rounds by dragging them into the correct sequence.
          </p>
        </div>
        <div class="assessment-round__stepper-horizontal">
          @for (step of stepSkeletons; track step) {
            <p-skeleton width="6rem" height="2rem" />
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundSkeletonComponent {
  selectedPills = [1, 2, 3];
  stepSkeletons = [1, 2, 3];
}
