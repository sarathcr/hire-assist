import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-frontdesk-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <!-- Form Container Skeleton -->
    <div class="frontdesk__form-container">
      <div class="frontdesk__card">
        <!-- Card Header Skeleton -->
        <div class="frontdesk__card-header">
          <div class="frontdesk__card-icon">
            <p-skeleton width="32px" height="32px" borderRadius="8px" />
          </div>
          <div class="frontdesk__card-header-text">
            <p-skeleton width="160px" height="16px" styleClass="mb-2" />
            <p-skeleton width="240px" height="12px" />
          </div>
        </div>

        <!-- Card Body Skeleton -->
        <div class="frontdesk__card-body">
          <div class="frontdesk__form-field-wrapper">
            <p-skeleton width="100%" height="38px" borderRadius="8px" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Skeleton -->
    <footer class="frontdesk__footer">
      <p-skeleton width="260px" height="14px" />
      <p-skeleton width="150px" height="38px" borderRadius="8px" />
    </footer>
  `,
  styleUrl: './front-desk.component.scss',
})
export class FrontdeskSkeletonComponent {}
