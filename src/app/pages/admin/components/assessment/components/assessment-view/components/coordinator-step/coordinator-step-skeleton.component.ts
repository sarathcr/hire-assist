import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-coordinator-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="coordinator">
      <!-- Round rows -->
      @for (row of rows; track row) {
        <div class="coordinator__row">
          <p-skeleton
            class="coordinator__form-field"
            width="100%"
            height="2rem"
          />
          <p-skeleton
            class="coordinator__form-field"
            width="100%"
            height="2rem"
          />
        </div>
      }
    </div>

    <!-- Add‑round button -->
    <div class="coordinator__action-button">
      <p-skeleton width="8rem" height="2rem" class="mt-2" />
    </div>

    <!-- Footer submit -->
    <div class="dialog-footer">
      <p-skeleton width="8rem" height="2rem" />
    </div>
  `,
  styleUrl: './coordinator-step.component.scss',
})
export class CoordinatorSkeletonComponent {
  rows = [1, 2]; // how many placeholder rows to show
}
