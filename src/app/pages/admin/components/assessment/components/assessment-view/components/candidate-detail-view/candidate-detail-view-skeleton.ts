import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-candidate-detail-view-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TabsModule],
  template: `
    <div class="candidate-skeleton">
      <!-- Header Section -->
      <div class="candidate-skeleton__header">
        <div class="candidate-skeleton__header-content">
          <p-skeleton
            shape="circle"
            width="80px"
            height="80px"
            styleClass="candidate-skeleton__avatar"
          />
          <div class="candidate-skeleton__header-info">
            <p-skeleton width="200px" height="30px" styleClass="mb-2" />
            <p-skeleton width="250px" height="20px" />
          </div>
        </div>
      </div>

      <p-tabs>
        <p-tablist>
          <p-tab>
            <i class="pi pi-user mr-2"></i>
            Candidate Details
          </p-tab>
          <p-tab>
            <i class="pi pi-history mr-2"></i>
            Previous Assessments
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel>
            <div class="candidate-skeleton__content">
              <!-- Basic Details Section -->
              <div class="candidate-skeleton__section">
                <div class="candidate-skeleton__section-title">
                 
                  <p-skeleton width="180px" height="24px" />
                </div>
                <div class="candidate-skeleton__card">
                  <div class="candidate-skeleton__card-grid">
                    @for (item of skeletonItems; track item) {
                      <div class="candidate-skeleton__info-item">
                        <p-skeleton
                          width="40px"
                          height="40px"
                          styleClass="candidate-skeleton__info-icon"
                        />
                        <div class="candidate-skeleton__info-content">
                          <p-skeleton
                            width="100px"
                            height="14px"
                            styleClass="mb-2"
                          />
                          <p-skeleton width="200px" height="20px" />
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Application Details Section -->
              <div class="candidate-skeleton__section">
                <div class="candidate-skeleton__section-title">
                  
                  <p-skeleton width="200px" height="24px" />
                </div>
                <div class="candidate-skeleton__card">
                  <div class="candidate-skeleton__questions">
                    @for (q of skeletonQuestions; track q) {
                      <div class="candidate-skeleton__question-item">
                        <p-skeleton
                          width="100%"
                          height="56px"
                          styleClass="rounded-lg"
                        />
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: `
    .candidate-skeleton {
      display: block;
      width: 100%;
      padding: 0 0 var(--spacing-30) 0;
      margin: 0 auto;

      &__header {
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          var(--secondary-color) 100%
        );
        border-radius: 0;
        padding: var(--spacing-30);
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }

      &__header-content {
        display: flex;
        align-items: center;
        gap: var(--spacing-20);
        margin: 0 auto;
      }

      &__avatar {
        flex-shrink: 0;
      }

      &__header-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-8);
      }

      &__content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-30);
      }

      &__section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-15);
      }

      &__section-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-12);
        font-size: var(--font-size-20);
        font-weight: 600;
        color: var(--color-dune);

        i {
          color: var(--primary-color);
          font-size: var(--font-size-18);
        }
      }

      &__card {
        background: var(--color-white);
        border: 1px solid var(--color-seperator);
        border-radius: var(--spacing-10);
        padding: var(--spacing-20);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &__card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-20);
      }

      &__info-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-15);
        padding: var(--spacing-15);
        background: var(--dashboard-main-background-color);
        border-radius: var(--spacing-8);
      }

      &__info-icon {
        flex-shrink: 0;
        border-radius: var(--spacing-8);
      }

      &__info-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-5);
      }

      &__questions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-15);
      }

      &__question-item {
        width: 100%;
      }
    }

    ::ng-deep {
      .p-tablist {
        border-bottom: 2px solid var(--color-seperator);
        margin-bottom: var(--spacing-30);
      }

      .p-tab {
        padding: var(--spacing-15) var(--spacing-20);
        font-weight: 500;
        color: var(--color-grey);
        transition: all 0.2s ease;

        &:hover {
          color: var(--primary-color);
        }

        &[aria-selected='true'] {
          color: var(--primary-color);
          border-bottom: 2px solid var(--primary-color);
        }
      }

      .p-tabpanels {
        background-color: transparent !important;
        padding: 0;
      }
    }

    @media (max-width: 1024px) {
      .candidate-skeleton {
        padding: 0 0 var(--spacing-20) 0;

        &__header {
          padding: var(--spacing-20);
          margin: 0 calc(-50vw + 50%) var(--spacing-20) calc(-50vw + 50%);
          width: 100vw;
        }

        &__header-content {
          gap: var(--spacing-15);
        }

        &__card-grid {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-15);
        }
      }
    }

    @media (max-width: 768px) {
      .candidate-skeleton {
        padding: 0 0 var(--spacing-15) 0;

        &__header {
          padding: var(--spacing-15);
          margin: 0 calc(-50vw + 50%) var(--spacing-20) calc(-50vw + 50%);
          width: 100vw;
        }

        &__header-content {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--spacing-15);
        }

        &__avatar {
          width: 60px !important;
          height: 60px !important;
        }

        &__header-info {
          width: 100%;
          align-items: center;
        }

        &__content {
          gap: var(--spacing-20);
        }

        &__section {
          gap: var(--spacing-12);
        }

        &__section-title {
          font-size: var(--font-size-18);
          gap: var(--spacing-10);

          i {
            font-size: var(--font-size-16);
          }
        }

        &__card {
          padding: var(--spacing-15);
        }

        &__card-grid {
          grid-template-columns: 1fr;
          gap: var(--spacing-12);
        }

        &__info-item {
          padding: var(--spacing-12);
          gap: var(--spacing-10);
        }

        &__info-icon {
          width: 36px !important;
          height: 36px !important;
        }

        &__questions {
          gap: var(--spacing-12);
        }
      }

      ::ng-deep {
        .p-tablist {
          margin-bottom: var(--spacing-20);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;

          &::-webkit-scrollbar {
            display: none;
          }
        }

        .p-tab {
          padding: var(--spacing-10) var(--spacing-12);
          font-size: var(--font-size-base);
          white-space: nowrap;
          min-width: auto;
          flex-shrink: 0;

          i {
            font-size: var(--font-size-base);
          }
        }
      }
    }

    @media (max-width: 480px) {
      .candidate-skeleton {
        padding: 0 0 var(--spacing-12) 0;

        &__header {
          padding: var(--spacing-12);
          margin: 0 calc(-50vw + 50%) var(--spacing-15) calc(-50vw + 50%);
          width: 100vw;
        }

        &__avatar {
          width: 50px !important;
          height: 50px !important;
        }

        &__section-title {
          font-size: var(--font-size-16);
        }

        &__card {
          padding: var(--spacing-12);
        }

        &__info-item {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        &__info-icon {
          margin-bottom: var(--spacing-8);
        }
      }

      ::ng-deep {
        .p-tab {
          padding: var(--spacing-8) var(--spacing-10);
          font-size: var(--font-size-small);

          i {
            display: none;
          }
        }
      }
    }
  `,
})
export class CandidateDetailViewSkeletonComponent {
  skeletonItems = new Array(5);
  skeletonQuestions = new Array(3);
}
