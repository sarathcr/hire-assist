import { Component } from '@angular/core';

@Component({
  selector: 'app-file-skeleton',
  standalone: true,
  template: `
    <div class="file-skeleton">
      <div class="file-skeleton__icon-wrapper">
        <i class="pi pi-image file-skeleton__icon"></i>
      </div>
      <span class="file-skeleton__text">Loading image preview...</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 100%;
        box-sizing: border-box;
      }

      @keyframes fullFrameShimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      @keyframes pulseBadge {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.06);
        }
      }

      .file-skeleton {
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: calc(85vh - 160px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        border-radius: 8px;
        background: linear-gradient(
          110deg,
          #f1f5f9 20%,
          #f8fafc 40%,
          #e2e8f0 50%,
          #f8fafc 60%,
          #f1f5f9 80%
        );
        background-size: 200% 100%;
        animation: fullFrameShimmer 1.8s linear infinite;
        box-sizing: border-box;

        &__icon-wrapper {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.08),
            0 1px 3px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.04);
          animation: pulseBadge 2.2s ease-in-out infinite;
        }

        &__icon {
          font-size: 34px;
          color: #64748b;
        }

        &__text {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.2px;
        }
      }
    `,
  ],
})
export class FileSkeletonComponent {}
