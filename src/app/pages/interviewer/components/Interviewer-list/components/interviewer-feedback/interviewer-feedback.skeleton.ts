import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-interviewer-feedback-skeleton',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    CardModule,
    DividerModule,
    AccordionModule,
  ],
  template: `
    <div class="interview-feedback-skeleton">
      <!-- Header Card Skeleton -->
      <p-card class="interview-feedback-skeleton__header-card">
        <div class="interview-feedback-skeleton__header">
          <p-skeleton shape="circle" width="72px" height="72px" />
          <div class="interview-feedback-skeleton__header-text">
            <p-skeleton width="300px" height="36px" styleClass="mb-2" />
            <p-skeleton width="200px" height="18px" />
          </div>
        </div>
      </p-card>

      <!-- Candidate Card Skeleton -->
      <p-card class="interview-feedback-skeleton__candidate-card">
        <div class="interview-feedback-skeleton__candidate-content">
          <div class="interview-feedback-skeleton__candidate-info">
            @for (item of [1, 2, 3]; track item) {
              <div class="interview-feedback-skeleton__candidate-item">
                <p-skeleton shape="circle" width="48px" height="48px" />
                <div class="interview-feedback-skeleton__candidate-details">
                  <p-skeleton width="120px" height="14px" styleClass="mb-1" />
                  <p-skeleton width="200px" height="16px" />
                </div>
              </div>
            }
          </div>
          <p-divider layout="vertical" />
          <div class="interview-feedback-skeleton__score-section">
            <p-skeleton shape="circle" width="120px" height="120px" />
            <p-skeleton width="80px" height="14px" styleClass="mt-2" />
          </div>
        </div>
      </p-card>

      <!-- Previous Rounds Section Skeleton -->
      <p-card class="interview-feedback-skeleton__section-card">
        <div class="interview-feedback-skeleton__section-header">
          <p-skeleton shape="circle" width="48px" height="48px" />
          <p-skeleton width="250px" height="24px" />
        </div>
        <p-divider />
        <div class="interview-feedback-skeleton__accordion-wrapper">
          @for (round of skeletonRounds; track round) {
            <div class="interview-feedback-skeleton__accordion-item">
              <div class="interview-feedback-skeleton__accordion-header">
                <p-skeleton width="150px" height="32px" />
              </div>
              <div class="interview-feedback-skeleton__accordion-content">
                <div class="interview-feedback-skeleton__detail-grid">
                  @for (detail of [1, 2, 3, 4, 5, 6]; track detail) {
                    <div class="interview-feedback-skeleton__detail-item">
                      <p-skeleton width="100px" height="14px" styleClass="mb-1" />
                      <p-skeleton width="80px" height="16px" />
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </p-card>

      <!-- Feedback Section Skeleton -->
      <p-card class="interview-feedback-skeleton__section-card">
        <div class="interview-feedback-skeleton__section-header">
          <p-skeleton shape="circle" width="48px" height="48px" />
          <p-skeleton width="200px" height="24px" />
        </div>
        <p-divider />
        <div class="interview-feedback-skeleton__accordion-wrapper">
          @for (feedback of [1, 2, 3, 4, 5, 6]; track feedback) {
            <div class="interview-feedback-skeleton__accordion-item">
              <div class="interview-feedback-skeleton__accordion-header">
                <p-skeleton width="120px" height="32px" />
                <p-skeleton width="60px" height="24px" />
              </div>
              <div class="interview-feedback-skeleton__accordion-content">
                <p-skeleton width="100%" height="200px" styleClass="mb-3" />
                <p-skeleton width="250px" height="56px" />
              </div>
            </div>
          }
        </div>
        <div class="interview-feedback-skeleton__submit-section">
          <p-skeleton width="200px" height="48px" />
        </div>
      </p-card>
    </div>
  `,
  styles: `
    .interview-feedback-skeleton {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
      background: linear-gradient(
        135deg,
        rgba(33, 150, 243, 0.03) 0%,
        rgba(21, 101, 192, 0.03) 100%
      );
      min-height: 100vh;

      &__header-card {
        border-radius: 20px;
        box-shadow: 0 8px 24px rgba(66, 165, 245, 0.15);
        margin-bottom: 0;

        ::ng-deep .p-card {
          border: none;
          box-shadow: none;
        }

        ::ng-deep .p-card-body {
          padding: 0;
        }
      }

      &__header {
        background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
        padding: 30px 40px;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      &__header-text {
        flex: 1;
      }

      &__candidate-card {
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        margin-bottom: 0;

        ::ng-deep .p-card-body {
          padding: 30px;
        }
      }

      &__candidate-content {
        display: flex;
        align-items: center;
        gap: 30px;
        flex-wrap: wrap;
      }

      &__candidate-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 300px;
      }

      &__candidate-item {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      &__candidate-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      &__score-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        padding: 20px;
        min-width: 180px;
      }

      &__section-card {
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        margin-bottom: 0;

        ::ng-deep .p-card-body {
          padding: 30px;
        }
      }

      &__section-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
      }

      &__accordion-wrapper {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      &__accordion-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        margin-bottom: 12px;
      }

      &__accordion-header {
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      &__accordion-content {
        padding: 16px;
      }

      &__detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      &__detail-item {
        padding: 12px;
        background: white;
        border-radius: 8px;
      }

      &__submit-section {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
        padding-top: 20px;
      }
    }

    @media screen and (max-width: 768px) {
      .interview-feedback-skeleton {
        padding: 16px;
        gap: 20px;

        &__header {
          padding: 20px 24px;
        }

        &__candidate-card ::ng-deep .p-card-body {
          padding: 20px;
        }

        &__candidate-content {
          flex-direction: column;
          gap: 20px;
        }

        &__section-card ::ng-deep .p-card-body {
          padding: 20px;
        }

        &__detail-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
    }
  `,
})
export class InterviewerFeedbackSkeletonComponent {
  skeletonRounds = [1, 2];
}
