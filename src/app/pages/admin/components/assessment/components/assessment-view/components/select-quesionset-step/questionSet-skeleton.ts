import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-question-set-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, AccordionModule],
  template: `
    <!-- Hero Section Skeleton -->
    <div class="QuestionSet__hero">
      <div class="QuestionSet__hero-content">
        <div class="QuestionSet__hero-icon">
          <p-skeleton shape="circle" width="64px" height="64px" />
        </div>
        <div class="QuestionSet__hero-text">
          <p-skeleton width="200px" height="28px" class="skeleton-mb-10" />
          <p-skeleton width="350px" height="16px" />
        </div>
        <p-skeleton width="180px" height="40px" />
      </div>
    </div>

    <!-- Accordion Section Skeleton -->
    <div class="QuestionSet__accordion-section">
      <div class="QuestionSet__accordion-header">
        <div class="QuestionSet__accordion-header-icon">
          <p-skeleton shape="circle" width="56px" height="56px" />
        </div>
        <div class="QuestionSet__accordion-header-text">
          <p-skeleton width="280px" height="24px" class="skeleton-mb-10" />
          <p-skeleton width="300px" height="16px" />
        </div>
      </div>
      <div class="QuestionSet__accordion-container">
        <p-accordion [multiple]="true">
          @for (item of accordionItems; track item) {
            <p-accordion-panel>
              <p-accordion-header>
                <div class="QuestionSet__accordion-item-header">
                  <p-skeleton
                    width="52px"
                    height="52px"
                    class="skeleton-rounded"
                  />
                  <div class="QuestionSet__accordion-item-content">
                    <p-skeleton
                      width="200px"
                      height="20px"
                      class="skeleton-mb-5"
                    />
                    <p-skeleton width="250px" height="14px" />
                  </div>
                  <p-skeleton
                    width="100px"
                    height="28px"
                    class="skeleton-rounded"
                  />
                </div>
              </p-accordion-header>
            </p-accordion-panel>
          }
        </p-accordion>
      </div>
    </div>
  `,
  styleUrl: './select-quesionset-step.component.scss',
})
export class QuestionSetStepSkeletonComponent {
  accordionItems = [1, 2, 3];
}
