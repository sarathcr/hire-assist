import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-candidate-detail-previous-assessment-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TabsModule],
  template: `
    <div class="previous-assessment-skeleton">
      <div class="previous-assessment-skeleton__header">
        <p-skeleton width="250px" height="24px" styleClass="mb-2" />
        <p-skeleton width="400px" height="16px" />
      </div>

      <div class="previous-assessment-skeleton__content">
        @for (assessment of skeletonAssessments; track assessment) {
          <div class="previous-assessment-skeleton__card">
            <div class="previous-assessment-skeleton__card-header">
              <p-skeleton width="200px" height="20px" />
              <p-skeleton width="80px" height="16px" />
            </div>
            <div class="previous-assessment-skeleton__card-body">
              @for (round of skeletonRounds; track round) {
                <div class="previous-assessment-skeleton__round">
                  <div class="previous-assessment-skeleton__round-header">
                    <p-skeleton width="150px" height="18px" />
                    <p-skeleton width="100px" height="16px" />
                  </div>
                  <div class="previous-assessment-skeleton__round-content">
                    @for (item of skeletonDetails; track item) {
                      <div class="previous-assessment-skeleton__detail-item">
                        <p-skeleton width="120px" height="14px" />
                        <p-skeleton width="80px" height="14px" />
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .previous-assessment-skeleton {
      padding: var(--spacing-20) 0;

      &__header {
        margin-bottom: var(--spacing-30);
        padding-bottom: var(--spacing-15);
        border-bottom: 1px solid var(--color-seperator);
      }

      &__content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-20);
      }

      &__card {
        background: var(--color-white);
        border: 1px solid var(--color-seperator);
        border-radius: var(--spacing-10);
        padding: var(--spacing-20);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &__card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-20);
        padding-bottom: var(--spacing-15);
        border-bottom: 1px solid var(--color-seperator);
      }

      &__card-body {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-18);
      }

      &__round {
        background: var(--dashboard-main-background-color);
        border-radius: var(--spacing-8);
        padding: var(--spacing-15);
      }

      &__round-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-15);
      }

      &__round-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-15);
      }

      &__detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-8);
        padding: var(--spacing-10);
        background: var(--color-white);
        border-radius: var(--spacing-6);
      }
    }

    @media (max-width: 768px) {
      .previous-assessment-skeleton {
        padding: var(--spacing-15) 0;

        &__header {
          margin-bottom: var(--spacing-20);
          padding-bottom: var(--spacing-12);
        }

        &__content {
          gap: var(--spacing-15);
        }

        &__card {
          padding: var(--spacing-15);
        }

        &__card-header {
          margin-bottom: var(--spacing-15);
          padding-bottom: var(--spacing-12);
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-10);
        }

        &__card-body {
          gap: var(--spacing-15);
        }

        &__round {
          padding: var(--spacing-12);
        }

        &__round-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-8);
        }

        &__round-content {
          grid-template-columns: 1fr;
          gap: var(--spacing-10);
        }
      }
    }

    @media (max-width: 480px) {
      .previous-assessment-skeleton {
        padding: var(--spacing-12) 0;

        &__card {
          padding: var(--spacing-12);
        }

        &__round {
          padding: var(--spacing-10);
        }
      }
    }
  `,
})
export class CandidateDetailPreviousAssessmentSkeletonComponent {
  skeletonAssessments = Array(2);
  skeletonRounds = Array(2);
  skeletonDetails = Array(4);
}
