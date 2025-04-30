import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-assessment-card-skeleton',
  imports: [SkeletonModule],
  template: `<div class="assessment-card_skeleton">
    @for (skeleton of skeletonArray; track skeleton) {
      <div class="assessment-card">
        <div class="assessment-card__header">
          <span class="assessment-card__over-title"
            ><p-skeleton width="8rem"
          /></span>
          <div class="assessment-card__actions">
            <p-skeleton width="2rem" height="1.5rem" />
          </div>
        </div>
        <div class="assessment-card__body">
          <h1 class="assessment-card__title"><p-skeleton width="100%" /></h1>
          <div class="assessment-card__progress">
            <div class="assessment-card__progress__title">
              <p-skeleton width="30%" />
            </div>
            <p-skeleton width="100%" />
          </div>
        </div>
        <div class="assessment-card__footer">
          <div
            class="assessment-card__footer_rounds"
            pTooltip="4 Assessment rounds defined for the assessments"
            tooltipPosition="top"
            tooltipStyleClass="assessment-card__tooltip"
          >
            <p-skeleton width="2rem" height="1.5rem" />
          </div>
          <div
            class="assessment-card__footer_users"
            pTooltip="Total 17 users are associated with the assessment"
            tooltipPosition="top"
            tooltipStyleClass="assessment-card__tooltip"
          >
            <p-skeleton width="2rem" height="1.5rem" />
          </div>
        </div>
      </div>
    }
  </div>`,
  styleUrl: './assessment-card.component.scss',
})
export class SkeletonComponent {
  public skeletonArray = [1, 2, 3];
}
