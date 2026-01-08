import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';

@Component({
  selector: 'app-interviewer-candidate-list-skeleton',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    CardModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
  ],
  template: `
    <div class="interview-candidate">
      <!-- Hero Header Section Skeleton -->
      <div class="interview-candidate__header">
        <div class="interview-candidate__header-content">
          <div class="interview-candidate__header-icon">
            <p-skeleton width="72px" height="72px" borderRadius="18px" />
          </div>
          <div class="interview-candidate__header-text">
            <p-skeleton width="250px" height="36px" borderRadius="4px" [style]="{ 'margin-bottom': '8px' }" />
            <p-skeleton width="300px" height="18px" borderRadius="4px" />
          </div>
        </div>
      </div>

      <!-- Summary Statistics Cards Skeleton -->
      <div class="interview-candidate__summary">
        @for (card of summaryCards; track card) {
          <p-card class="interview-candidate__summary-card" [ngClass]="card.class">
            <div class="interview-candidate__summary-content">
              <div class="interview-candidate__summary-icon">
                <p-skeleton width="56px" height="56px" borderRadius="14px" />
              </div>
              <div class="interview-candidate__summary-info">
                <p-skeleton width="120px" height="14px" borderRadius="4px" [style]="{ 'margin-bottom': '8px' }" />
                <p-skeleton width="60px" height="32px" borderRadius="4px" />
              </div>
            </div>
          </p-card>
        }
      </div>

      <!-- Tabs Section Skeleton -->
      <div class="interview-candidate__tabs-section">
        <p-tabs value="0" class="interview-candidate__tabs">
          <p-tablist class="interview-candidate__tablist">
            @for (tab of tabs; track tab.value) {
              <p-tab [value]="tab.value" class="interview-candidate__tab">
                <div class="interview-candidate__tab-content">
                  <p-skeleton width="18px" height="18px" borderRadius="4px" />
                  <p-skeleton width="120px" height="20px" borderRadius="4px" />
                </div>
              </p-tab>
            }
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="0" class="interview-candidate__tabpanel">
              <!-- Table Skeleton -->
              <div class="interview-candidate__table-skeleton">
                <!-- Search bar skeleton -->
                <div class="interview-candidate__table-search-skeleton">
                  <p-skeleton width="300px" height="40px" borderRadius="8px" />
                </div>
                <!-- Table header skeleton -->
                <div class="interview-candidate__table-header-skeleton">
                  <p-skeleton width="100%" height="20px" borderRadius="4px" />
                  <p-skeleton width="100%" height="20px" borderRadius="4px" />
                  <p-skeleton width="100%" height="20px" borderRadius="4px" />
                  <p-skeleton width="100%" height="20px" borderRadius="4px" />
                  <p-skeleton width="100%" height="20px" borderRadius="4px" />
                </div>
                <!-- Table rows skeleton -->
                <div class="interview-candidate__table-rows-skeleton">
                  @for (row of tableRows; track row) {
                    <div class="interview-candidate__table-row-skeleton">
                      <p-skeleton width="100%" height="20px" borderRadius="4px" />
                      <p-skeleton width="100%" height="20px" borderRadius="4px" />
                      <p-skeleton width="100%" height="20px" borderRadius="4px" />
                      <p-skeleton width="100%" height="20px" borderRadius="4px" />
                      <p-skeleton width="80px" height="32px" borderRadius="6px" />
                    </div>
                  }
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
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

  public tabs = [
    { value: '0', label: "Today's Interviews" },
    { value: '1', label: 'Upcoming Interviews' },
    { value: '2', label: 'Previous Interviews' },
  ];

  public tableColumns = [1, 2, 3, 4, 5]; // 5 columns: Name, Email, Score, Status, Actions
  public tableRows = [1, 2, 3, 4, 5]; // 5 rows
}
