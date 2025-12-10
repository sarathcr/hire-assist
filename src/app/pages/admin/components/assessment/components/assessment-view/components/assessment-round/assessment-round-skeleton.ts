import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assessment-round-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="assessment-round">
      <div class="assessment-round__header">
        <p-skeleton width="250px" height="1.75rem" />
      </div>

      <div class="assessment-round__content">
        <!-- Select Section Skeleton -->
        <div class="assessment-round__select-section">
          <div class="assessment-round__select-wrapper">
            <p-skeleton
              class="assessment-round__multiselect-skeleton"
              width="100%"
              height="2.5rem"
            />
            <p-skeleton width="140px" height="2.5rem" />
          </div>
        </div>

        <!-- Rounds Section Skeleton -->
        <div class="assessment-round__rounds-section">
          <div class="assessment-round__rounds-list">
            @for (step of stepSkeletons; track step) {
              <div class="assessment-round__round-item">
                <p-skeleton
                  shape="circle"
                  size="30px"
                  styleClass="assessment-round__round-number-skeleton"
                />
                <p-skeleton
                  width="120px"
                  height="1.5rem"
                  styleClass="assessment-round__round-name-skeleton"
                />
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Footer Skeleton -->
      <div class="assessment-round__footer">
        <p-skeleton width="180px" height="2.5rem" />
      </div>
    </div>
  `,
  styleUrl: './assessment-round.component.scss',
})
export class AssessmentRoundSkeletonComponent {
  stepSkeletons = [1, 2, 3];
}
