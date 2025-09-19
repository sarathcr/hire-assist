import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assign-panel-interviewer-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="Panel__section">
      <div class="Panel__section-header">
        <h2 class="Panel__section__title app-title">
          Assign interviewers to panels
        </h2>
        <p class="Panel__section__description">
          Select the panel and choose the interviewers to be assigned.
        </p>
      </div>

      <div class="Panel">
        <!-- panel rows -->
        @for (row of rows; track row) {
          <div class="Panel__row">
            <p-skeleton class="Panel__form-field" width="100%" height="3rem" />
            <p-skeleton class="Panel__form-field" width="100%" height="3rem" />
          </div>
        }
      </div>

      <!-- Add‑panel button -->
      <div class="Panel__action-button">
        <p-skeleton width="8rem" height="2.5rem" class="mt-2" />
      </div>

      <!-- Footer submit -->
      <div class="dialog-footer">
        <p-skeleton width="8rem" height="2.5rem" />
      </div>
    </div>

    <div class="Panel__section">
      <div class="Panel__section-header">
        <h2 class="Panel__section__title app-title">Create Panel</h2>
        <p class="Panel__section__description">Create a new custom panel</p>
      </div>

      <div class="Panel__field">
        <p-skeleton width="100%" height="3rem" />
      </div>
      <div class="Panel__description">
        <p-skeleton width="100%" height="3rem" />
      </div>
      <p-skeleton width="8rem" height="2.5rem" />
    </div>
  `,
  styleUrl: './assign-panel-interviewer.component.scss',
})
export class AssignPanelInterviewerSkeletonComponent {
  rows = [1, 2];
}
