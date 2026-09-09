import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-coordinator-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <!-- Form Container Skeleton -->
    <div class="coordinator__form-container">
      @for (row of rows; track row) {
        <div class="coordinator__card">
          <!-- Card Header Skeleton -->
          <div class="coordinator__card-header">
            <p-skeleton width="24px" height="24px" borderRadius="6px" />
            <p-skeleton width="120px" height="16px" />
          </div>

          <!-- Card Body Skeleton -->
          <div class="coordinator__card-body">
            <div class="coordinator__form-row">
              <!-- Recruitment Round Field Skeleton -->
              <div
                class="coordinator__form-field-wrapper coordinator__form-field--round"
              >
                <p-skeleton width="110px" height="14px" class="mb-2" />
                <p-skeleton width="100%" height="38px" borderRadius="8px" />
              </div>

              <!-- Coordinator Field Skeleton -->
              <div
                class="coordinator__form-field-wrapper coordinator__form-field--coordinator"
              >
                <p-skeleton width="80px" height="14px" class="mb-2" />
                <p-skeleton width="100%" height="38px" borderRadius="8px" />
              </div>

              <!-- Remove Button Skeleton -->
              <div class="coordinator__card-actions">
                <p-skeleton width="90px" height="38px" borderRadius="8px" />
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Footer Skeleton -->
    <footer class="coordinator__footer">
      <p-skeleton width="150px" height="38px" borderRadius="8px" />
      <p-skeleton width="100px" height="38px" borderRadius="8px" />
    </footer>
  `,
  styleUrl: './coordinator-step.component.scss',
})
export class CoordinatorSkeletonComponent {
  rows = [1, 2]; // how many placeholder rows to show
}
