import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TableSkeletonComponent } from '../../../../../../../../shared/components/table/table.skeleton';

@Component({
  selector: 'app-question-set-step-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TableSkeletonComponent],
  template: `
    <div class="QuestionSet__section">
      <!-- Select QuestionSet -->
      <div class="QuestionSet__section-header">
        <h2 class="QuestionSet__section__title app-title">
          Select question set
        </h2>
        <p class="QuestionSet__section__description">
          Choose from available question set for this assessment
        </p>
      </div>
      <div class="QuestionSet__btn-wrapper">
        <p-skeleton class="QuestionSet__section__skeleton" height="2rem" />
        <div class="QuestionSet__action-button">
          <p-skeleton width="6rem" height="2rem" />
        </div>
      </div>
    </div>

    <!-- Create QuestionSet -->

    <div class="QuestionSet__section">
      <div class="QuestionSet__section-header">
        <h2 class="QuestionSet__section__title app-title">
          Create Question Set
        </h2>
        <p class="QuestionSet__section__description">
          Create a new custom question set and assign to your assessment
        </p>
      </div>
      <div class="QuestionSet__section__description">
        <p-skeleton class="QuestionSet__section__description" height="2rem" />
      </div>

      <div class="QuestionSet__section__description">
        <p-skeleton class="QuestionSet__section__description" height="2rem" />
      </div>

      <div class="QuestionSet__action-button">
        <p-skeleton width="4rem" height="2rem" />
      </div>
    </div>
    <!-- Select Questions -->
    <div class="QuestionSet__section">
      <div class="QuestionSet__section-header">
        <h2 class="QuestionSet__section__title app-title">
          Select questions for the set
        </h2>
        <p class="QuestionSet__section__description">
          Select the questions of questionset
        </p>
      </div>
      <app-table-skeleton></app-table-skeleton>
    </div>
  `,
  styleUrl: './select-quesionset-step.component.scss',
})
export class QuestionSetStepSkeletonComponent {
  tableSkeletons = [1, 2, 3, 4];
}
