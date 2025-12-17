import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { TableSkeletonComponent } from '../../../../../../../../shared/components/table/table.skeleton';

@Component({
  selector: 'app-question-set-step-skeleton',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    TableSkeletonComponent,
    AccordionModule,
  ],
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
              <p-accordion-content>
                @if (item === 1) {
                  <div class="QuestionSet__summary">
                    <div class="QuestionSet__summary-header">
                      <p-skeleton shape="circle" width="52px" height="52px" />
                      <p-skeleton width="220px" height="22px" />
                      <p-skeleton width="100px" height="16px" />
                    </div>
                    <div class="QuestionSet__summary-content">
                      <div class="QuestionSet__summary-table">
                        <p-skeleton
                          width="100%"
                          height="200px"
                          class="skeleton-rounded"
                        />
                      </div>
                      <div class="QuestionSet__summary-knob">
                        <p-skeleton
                          shape="circle"
                          width="120px"
                          height="120px"
                        />
                        <p-skeleton
                          width="80px"
                          height="16px"
                          class="skeleton-mt-15"
                        />
                      </div>
                    </div>
                  </div>
                }
                <div class="QuestionSet__table-container">
                  <app-table-skeleton></app-table-skeleton>
                </div>
                <div class="QuestionSet__actions">
                  <p-skeleton width="160px" height="40px" />
                </div>
              </p-accordion-content>
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
