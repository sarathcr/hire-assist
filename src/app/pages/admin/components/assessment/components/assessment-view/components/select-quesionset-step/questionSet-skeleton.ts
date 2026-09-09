import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-question-set-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <!-- Accordion Section Skeleton -->
    <div class="QuestionSet__accordion-section">
      <div class="QuestionSet__accordion-header">
        <div class="QuestionSet__accordion-header-icon">
          <p-skeleton width="20px" height="20px" borderRadius="4px" />
        </div>
        <div class="QuestionSet__accordion-header-text">
          <p-skeleton width="180px" height="18px" styleClass="mb-2" />
          <p-skeleton width="280px" height="13px" />
        </div>
      </div>
      <div class="QuestionSet__accordion-container">
        @for (item of accordionItems; track item) {
          <div class="QuestionSet__skeleton-round-card">
            <div class="QuestionSet__accordion-item-icon">
              <p-skeleton width="20px" height="20px" borderRadius="4px" />
            </div>
            <div class="QuestionSet__accordion-item-content">
              <p-skeleton width="160px" height="18px" styleClass="mb-2" />
              <p-skeleton width="110px" height="13px" />
            </div>
            <div class="QuestionSet__accordion-item-actions">
              <p-skeleton width="130px" height="32px" borderRadius="8px" />
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './select-quesionset-step.component.scss',
})
export class QuestionSetStepSkeletonComponent {
  accordionItems = [1, 2, 3];
}
