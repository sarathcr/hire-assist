import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-candidate-test-skeleton',
  standalone: true,
  imports: [SkeletonModule],
  styleUrl: './candidate-test.component.scss',
  template: `
    <div class="assessment_skeleton" style="min-height: 62.5rem;">
      <div class="assessment">
        <div class="assessment__carousel">
          @for (question of [1, 2, 3, 4, 5, 6]; track question) {
            <div class="assessment__carousel__button">
              <p-skeleton shape="circle" size="3rem" styleClass="mr-2" />
            </div>
          }
        </div>

        <div class="assessment__tooltip">
          <ul class="assessment__tooltip-list">
            <li class="assessment__tooltip-list-item">
              @for (indicator of [1, 2, 3, 4, 5]; track indicator) {
                <span
                  class="assessment__tooltip-item assessment__tooltip-item_active"
                >
                  <span class="assessment__tooltip-text">
                    <p-skeleton width="2rem" height="1.5rem" />
                  </span>
                </span>
                <span
                  class="assessment__tooltip-item assessment__tooltip-item_skip"
                >
                  <span class="assessment__tooltip-text">
                    <p-skeleton width="2rem" height="1.5rem" />
                  </span>
                </span>
                <span
                  class="assessment__tooltip-item assessment__tooltip-item_review"
                >
                  <span class="assessment__tooltip-text">
                    <p-skeleton width="2rem" height="1.5rem" />
                  </span>
                </span>
                <span
                  class="assessment__tooltip-item assessment__tooltip-item_complete"
                >
                  <span class="assessment__tooltip-text">
                    <p-skeleton width="2rem" height="1.5rem" />
                  </span>
                </span>
                <span
                  class="assessment__tooltip-item assessment__tooltip-item_unattended"
                >
                  <span class="assessment__tooltip-text">
                    <p-skeleton width="2rem" height="1.5rem" />
                  </span>
                </span>
              }
            </li>
          </ul>
        </div>

        <div class="assessment__header-wrapper">
          <p class="assessment__title">
            <p-skeleton width="10rem" height="1.5rem" />
          </p>
          <div class="assessment__header_end">
            <p-skeleton width="4rem" height="1.5rem" />
          </div>
        </div>

        <div class="assessment__question">
          <div class="assessment__checkbox-group">
            <p-skeleton width="60%" height="2rem" class="mb-4" />

            @for (opt of [1, 2, 3, 4]; track opt) {
              <div class="assessment__checkbox-item">
                <p-skeleton shape="circle" size="1.2rem" class="mr-2" />
                <p-skeleton width="10rem" height="1.2rem" />
              </div>
            }
          </div>
        </div>

        <div class="assessment__actionButtons">
          <div class="assessment__actionButtons_review-skip-button">
            <p-skeleton
              width="8rem"
              height="2.5rem"
              styleClass="mr-2"
              borderRadius="0.5rem"
            ></p-skeleton>
            <p-skeleton
              width="5rem"
              height="2.5rem"
              styleClass="mr-2"
              borderRadius="0.5rem"
            ></p-skeleton>
          </div>

          <div class="save-button">
            <p-skeleton
              width="8rem"
              height="2.5rem"
              borderRadius="0.5rem"
            ></p-skeleton>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CandidateTestSkeletonComponent {}
