import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-coordinator-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="coordinator__section">
      <!-- Form Container Skeleton -->
      <div class="coordinator__form-container">
        @for (row of rows; track row) {
          <div class="coordinator__card">
            <!-- Card Header Skeleton -->
            <div class="coordinator__card-header">
              <p-skeleton shape="circle" width="32px" height="32px" />
              <p-skeleton width="120px" height="22px" />
            </div>

            <!-- Card Body Skeleton -->
            <div class="coordinator__card-body">
              <div class="coordinator__form-row">
                <!-- Recruitment Round Field Skeleton -->
                <div
                  class="coordinator__form-field-wrapper coordinator__form-field--round"
                >
                  <p-skeleton width="140px" height="18px" class="mb-2" />
                  <p-skeleton width="100%" height="42px" />
                </div>

                <!-- Coordinator Field Skeleton -->
                <div
                  class="coordinator__form-field-wrapper coordinator__form-field--coordinator"
                >
                  <p-skeleton width="100px" height="18px" class="mb-2" />
                  <p-skeleton width="100%" height="42px" />
                </div>

                <!-- Remove Button Skeleton -->
                <div class="coordinator__card-actions">
                  <p-skeleton width="100px" height="42px" />
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer Skeleton -->
      <footer class="coordinator__footer">
        <p-skeleton width="160px" height="42px" />
        <p-skeleton width="120px" height="42px" />
      </footer>
    </div>
  `,
  styleUrl: './coordinator-step.component.scss',
})
export class CoordinatorSkeletonComponent {
  rows = [1, 2]; // how many placeholder rows to show
}
