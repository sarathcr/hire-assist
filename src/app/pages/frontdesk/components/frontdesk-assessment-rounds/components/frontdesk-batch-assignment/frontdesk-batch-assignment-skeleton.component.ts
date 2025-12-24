import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-frontdesk-batch-assignment-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, AccordionModule],
  template: `
    <p-accordion [value]="0">
      @for (item of skeletonBatches; track item) {
        <p-accordion-panel [value]="item.toString()">
          <p-accordion-header>
            <p-skeleton width="10rem" height="1.2rem" />
          </p-accordion-header>
          <p-accordion-content>
            <div class="batch-detail__skeleton-chip">
              <p-skeleton width="8rem" height="2rem" />
            </div>
            <div class="batch-detail__skeleton-table">
              <p-skeleton width="100%" height="15rem" />
            </div>
          </p-accordion-content>
        </p-accordion-panel>
      }
    </p-accordion>
  `,
  styleUrl: './frontdesk-batch-assignment.component.scss',
})
export class FrontdeskBatchAssignmentSkeletonComponent {
  skeletonBatches = [1, 2, 3];
}

