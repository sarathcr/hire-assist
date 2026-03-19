import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-interviewer-candidate-list-skeleton',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    CardModule,
  ],
  template: `
    <div class="interview-candidate">
      <div class="interview-candidate__content">
        <!-- Summary Statistics Cards Skeleton -->
        <div class="interview-candidate__summary">
          @for (card of summaryCards; track card) {
            <p-card class="interview-candidate__summary-card" [ngClass]="card.class">
              <div class="interview-candidate__summary-content">
                <div class="interview-candidate__summary-icon">
                  <p-skeleton width="44px" height="44px" borderRadius="10px" />
                </div>
                <div class="interview-candidate__summary-info">
                  <p-skeleton width="100px" height="14px" borderRadius="4px" [style]="{ 'margin-bottom': '8px' }" />
                  <p-skeleton width="60px" height="28px" borderRadius="4px" />
                </div>
              </div>
            </p-card>
          }
        </div>

        <!-- Table Section Skeleton -->
        <div class="interview-candidate__table-section">
          <div class="interview-candidate__table-skeleton">
            <!-- Search bar skeleton -->
            <div class="interview-candidate__table-search-skeleton">
              <p-skeleton width="320px" height="42px" borderRadius="10px" />
            </div>
            
            <!-- Table header skeleton -->
            <div class="interview-candidate__table-header-skeleton">
              <p-skeleton width="150px" height="14px" borderRadius="4px" />
              <p-skeleton width="120px" height="14px" borderRadius="4px" />
              <p-skeleton width="120px" height="14px" borderRadius="4px" />
              <p-skeleton width="80px" height="14px" borderRadius="4px" />
              <p-skeleton width="80px" height="14px" borderRadius="4px" />
            </div>

            <!-- Table rows skeleton -->
            <div class="interview-candidate__table-rows-skeleton">
              @for (row of tableRows; track row) {
                <div class="interview-candidate__table-row-skeleton">
                  <p-skeleton width="80%" height="16px" borderRadius="4px" />
                  <p-skeleton width="70%" height="16px" borderRadius="4px" />
                  <p-skeleton width="60%" height="16px" borderRadius="4px" />
                  <p-skeleton width="50px" height="16px" borderRadius="4px" />
                  <p-skeleton width="80px" height="32px" borderRadius="6px" />
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './interviewer-candidate-list.component.scss',
})
export class InterviewerCandidateListSkeletonComponent {
  public summaryCards = [
    { class: 'interview-candidate__summary-card--today' },
    { class: 'interview-candidate__summary-card--upcoming' },
    { class: 'interview-candidate__summary-card--previous' },
    { class: 'interview-candidate__summary-card--total' },
  ];

  public tableRows = [1, 2, 3, 4, 5];
}
