import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assessment-round-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="assessment-round__section">
      <!-- Header Skeleton -->
      <div class="assessment-round__section-header">
        <div class="assessment-round__header-content">
          <div class="assessment-round__header-icon">
            <p-skeleton shape="circle" width="56px" height="56px" />
          </div>
          <div class="assessment-round__header-text">
            <p-skeleton
              width="280px"
              height="28px"
              class="assessment-round__skeleton-title skeleton-mb-10"
            />
            <p-skeleton width="100%" height="20px" />
          </div>
        </div>
      </div>

      <div class="assessment-round">
        <!-- Main Content -->
        <div class="assessment-round__content">
          <!-- Select Section Skeleton -->
          <div class="assessment-round__select-section">
            <div class="assessment-round__select-wrapper">
              <p-skeleton
                class="assessment-round__multiselect_skeleton"
                width="100%"
                height="42px"
              />
              <p-skeleton width="140px" height="42px" />
            </div>
          </div>

          <!-- Description Skeleton -->
          <p-skeleton
            width="350px"
            height="20px"
            class="assessment-round__skeleton-description"
          />

          <!-- Rounds Section Skeleton -->
          <div class="assessment-round__rounds-section">
            <div class="assessment-round__rounds-list">
              @for (step of stepSkeletons; track step) {
                <div class="assessment-round__round-item">
                  <div class="assessment-round__skeleton-round-number">
                    <p-skeleton shape="circle" width="30px" height="30px" />
                  </div>
                  <p-skeleton
                    width="140px"
                    height="20px"
                    class="assessment-round__round-name-skeleton"
                  />
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Footer Skeleton -->
        <div class="assessment-round__footer">
          <p-skeleton width="180px" height="42px" />
        </div>
      </div>
    </div>
  `,
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundSkeletonComponent {
  stepSkeletons = [1, 2, 3];
}
