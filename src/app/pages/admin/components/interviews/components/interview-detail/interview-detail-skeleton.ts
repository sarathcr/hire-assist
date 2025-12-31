import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-interview-detail-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, CardModule, DividerModule],
  template: `
    <div class="interview-detail interview-detail--skeleton">
      <!-- Header Skeleton -->
      <p-card class="interview-detail__header-card">
        <div class="interview-detail__header">
          <div class="interview-detail__header-content">
            <div class="interview-detail__header-icon">
              <p-skeleton shape="circle" size="56px" />
            </div>
            <div class="interview-detail__header-text">
              <p-skeleton width="200px" height="24px" class="interview-detail__skeleton-spacing" />
              <p-skeleton width="150px" height="14px" />
            </div>
          </div>
        </div>
      </p-card>

      <!-- Candidate Card Skeleton -->
      <p-card class="interview-detail__candidate-card">
        <div class="interview-detail__candidate-content">
          <div class="interview-detail__candidate-info">
            <div class="interview-detail__candidate-item">
              <p-skeleton shape="circle" size="40px" />
              <div class="interview-detail__candidate-details">
                <p-skeleton width="100px" height="11px" class="interview-detail__skeleton-spacing-small" />
                <p-skeleton width="180px" height="15px" />
              </div>
            </div>
            <p-divider layout="vertical" />
            <div class="interview-detail__candidate-item">
              <p-skeleton shape="circle" size="40px" />
              <div class="interview-detail__candidate-details">
                <p-skeleton width="60px" height="11px" class="interview-detail__skeleton-spacing-small" />
                <p-skeleton width="220px" height="15px" />
              </div>
            </div>
          </div>
          <p-divider layout="vertical" />
          <div class="interview-detail__score-section">
            <p-skeleton shape="circle" size="100px" />
            <p-skeleton width="70px" height="11px" class="interview-detail__skeleton-spacing-top" />
            <p-skeleton width="50px" height="20px" />
          </div>
        </div>
      </p-card>

      <!-- Previous Rounds Section Skeleton -->
      <p-card class="interview-detail__section-card">
        <div class="interview-detail__section-header">
          <p-skeleton shape="circle" size="40px" />
          <p-skeleton width="180px" height="18px" />
        </div>
        <p-divider />
        <div class="interview-detail__accordion-wrapper">
          @for (s of skeletonRounds; track s) {
            <div class="interview-detail__accordion-panel-skeleton">
              <div class="interview-detail__accordion-header-skeleton">
                <p-skeleton width="130px" height="16px" />
              </div>
              <div class="interview-detail__accordion-content-skeleton">
                <div class="interview-detail__round-grid">
                  @for (item of [1, 2, 3, 4, 5, 6]; track item) {
                    <div class="interview-detail__round-item">
                      <p-skeleton width="90px" height="11px" class="interview-detail__skeleton-spacing-small" />
                      <p-skeleton width="70px" height="15px" />
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </p-card>

      <!-- Feedback Section Skeleton -->
      <p-card class="interview-detail__section-card">
        <div class="interview-detail__section-header">
          <p-skeleton shape="circle" size="40px" />
          <p-skeleton width="100px" height="18px" />
        </div>
        <p-divider />
        <div class="interview-detail__accordion-wrapper">
          @for (f of skeletonFeedback; track f) {
            <div class="interview-detail__accordion-panel-skeleton">
              <div class="interview-detail__accordion-header-skeleton">
                <p-skeleton width="110px" height="16px" />
              </div>
              <div class="interview-detail__accordion-content-skeleton">
                <p-skeleton width="100%" height="200px" class="interview-detail__skeleton-spacing-bottom" />
                <div class="interview-detail__score-input-wrapper">
                  <p-skeleton width="180px" height="36px" />
                </div>
                <div class="interview-detail__action-buttons">
                  <p-skeleton width="70px" height="36px" />
                </div>
              </div>
            </div>
          }
        </div>
        <p-divider />
        <div class="interview-detail__submit-section">
          <p-skeleton width="140px" height="42px" />
        </div>
      </p-card>
    </div>
  `,
  styleUrl: './interview-detail.component.scss',
})
export class InterviewDetailSkeletonComponent {
  skeletonRounds = [1, 2];
  skeletonFeedback = [1, 2, 3];
}
