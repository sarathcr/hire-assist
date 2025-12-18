import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-frontdesk-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="frontdesk__section">
      <!-- Form Container Skeleton -->
      <div class="frontdesk__form-container">
        <div class="frontdesk__card">
          <!-- Card Header Skeleton -->
          <div class="frontdesk__card-header">
            <div class="frontdesk__skeleton-icon">
              <p-skeleton shape="square" width="48px" height="48px" />
            </div>
            <div class="frontdesk__skeleton-card-text">
              <p-skeleton width="200px" height="22px" />
              <p-skeleton width="100%" height="16px" />
            </div>
          </div>

          <!-- Card Body Skeleton -->
          <div class="frontdesk__card-body">
            <div class="frontdesk__form-field-wrapper">
              <p-skeleton width="100%" height="42px" />
            </div>

            <!-- Selected Section Skeleton -->
            <div class="frontdesk__selected-section">
              <div class="frontdesk__selected-header">
                <p-skeleton shape="circle" width="18px" height="18px" />
                <p-skeleton width="220px" height="16px" />
              </div>
              <div class="frontdesk__selected-list">
                <div class="frontdesk__skeleton-item">
                  <p-skeleton width="150px" height="52px" />
                </div>
                <div class="frontdesk__skeleton-item">
                  <p-skeleton width="150px" height="52px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Skeleton -->
      <footer class="frontdesk__footer">
        <p-skeleton width="300px" height="20px" />
        <div class="frontdesk__skeleton-button">
          <p-skeleton width="160px" height="42px" />
        </div>
      </footer>
    </div>
  `,
  styleUrl: './front-desk.component.scss',
})
export class FrontdeskSkeletonComponent {}
