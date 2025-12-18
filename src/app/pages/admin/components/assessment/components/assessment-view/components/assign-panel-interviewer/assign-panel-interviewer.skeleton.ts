import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assign-panel-interviewer-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="panel__section">
      <!-- Header Skeleton -->
      <div class="panel__section-header">
        <div class="panel__header-content">
          <div class="panel__header-icon">
            <p-skeleton shape="circle" width="56px" height="56px" />
          </div>
          <div class="panel__header-text">
            <p-skeleton
              width="300px"
              height="28px"
              class="mb-2 skeleton-mb-10"
            />
            <p-skeleton width="500px" height="20px" />
          </div>
        </div>
      </div>

      <!-- Form Container Skeleton -->
      <div class="panel__form-container">
        @for (row of rows; track row) {
          <div class="panel__card">
            <!-- Card Header Skeleton -->
            <div class="panel__card-header">
              <p-skeleton shape="circle" width="32px" height="32px" />
              <p-skeleton width="140px" height="22px" />
            </div>

            <!-- Card Body Skeleton -->
            <div class="panel__card-body">
              <div class="panel__form-row">
                <!-- Panel Field Skeleton -->
                <div class="panel__form-field-wrapper panel__form-field--panel">
                  <p-skeleton width="80px" height="18px" class="mb-2" />
                  <p-skeleton width="100%" height="42px" />
                </div>

                <!-- Interviewers Field Skeleton -->
                <div
                  class="panel__form-field-wrapper panel__form-field--interviewers"
                >
                  <p-skeleton width="100px" height="18px" class="mb-2" />
                  <p-skeleton width="100%" height="42px" />
                </div>

                <!-- Remove Button Skeleton -->
                <div class="panel__card-actions">
                  <p-skeleton width="100px" height="42px" />
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer Skeleton -->
      <footer class="panel__footer">
        <div class="panel__footer-actions">
          <p-skeleton width="140px" height="42px" />
          <p-skeleton width="140px" height="42px" />
        </div>
        <p-skeleton width="120px" height="42px" />
      </footer>
    </div>
  `,
  styleUrl: './assign-panel-interviewer.component.scss',
})
export class AssignPanelInterviewerSkeletonComponent {
  rows = [1, 2]; // how many placeholder rows to show
}
