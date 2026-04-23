import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-interviewer-panels-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, AccordionModule],
  template: `
    <p-accordion [value]="0">
      @for (item of skeletonPanels; track item) {
        <p-accordion-panel [value]="item.toString()">
          <p-accordion-header>
            <p-skeleton width="12rem" height="1.2rem" />
          </p-accordion-header>
          <p-accordion-content>
            <div class="panel-detail__skeleton-chip">
              <p-skeleton width="9rem" height="2rem" />
            </div>
            <div class="panel-detail__skeleton-table">
              <p-skeleton width="100%" height="15rem" />
            </div>
          </p-accordion-content>
        </p-accordion-panel>
      }
    </p-accordion>
  `,
  styleUrl: './interviewer-recruitment-panels.component.scss',
})
export class InterviewerPanelsSkeletonComponent {
  skeletonPanels = [1, 2, 3];
}
