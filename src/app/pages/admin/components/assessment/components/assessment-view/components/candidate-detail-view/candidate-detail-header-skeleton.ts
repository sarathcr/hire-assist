import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-candidate-detail-header-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="candidate-detail-header-skeleton">
      <div class="candidate-detail-header-skeleton__content">
        <p-skeleton
          shape="circle"
          width="80px"
          height="80px"
          styleClass="candidate-detail-header-skeleton__avatar"
        />
        <div class="candidate-detail-header-skeleton__info">
          <p-skeleton width="200px" height="30px" styleClass="mb-2" />
          <p-skeleton width="250px" height="20px" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .candidate-detail-header-skeleton {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      border-radius: 0;
      padding: var(--spacing-30);
      margin: 0 calc(-50vw + 50%) var(--spacing-30) calc(-50vw + 50%);
      width: 100vw;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      min-height: 150px;
      display: flex;
      align-items: center;
    }

    .candidate-detail-header-skeleton__content {
      display: flex;
      align-items: center;
      gap: var(--spacing-20);
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .candidate-detail-header-skeleton__avatar {
      flex-shrink: 0;
    }

    .candidate-detail-header-skeleton__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-8);
    }

    @media (max-width: 768px) {
      .candidate-detail-header-skeleton {
        padding: var(--spacing-15);
        min-height: 120px;
      }

      .candidate-detail-header-skeleton__content {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--spacing-15);
      }

      .candidate-detail-header-skeleton__avatar {
        width: 60px !important;
        height: 60px !important;
      }

      .candidate-detail-header-skeleton__info {
        width: 100%;
        align-items: center;
      }
    }

    @media (max-width: 480px) {
      .candidate-detail-header-skeleton {
        padding: var(--spacing-12);
        min-height: 100px;
      }

      .candidate-detail-header-skeleton__avatar {
        width: 50px !important;
        height: 50px !important;
      }
    }
  `,
})
export class CandidateDetailHeaderSkeletonComponent {}

