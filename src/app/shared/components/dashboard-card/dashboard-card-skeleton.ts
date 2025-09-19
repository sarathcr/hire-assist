import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-dashboard-card-skeleton',
  imports: [SkeletonModule],
  template: `<div class="dashboard-card">
    <h2 class="dashboard-card__title dashboard-card__title_skeleton">
      <p-skeleton width="10rem" />
    </h2>
    <span class="dashboard-card__count">
      <p-skeleton width="2rem" height="2rem" />
    </span>
    <div class="dashboard-card__status dashboard-card__status_skeleton">
      <span class="flex gap-1">
        <p-skeleton width="3rem" />
        <span class="dashboard-card__active"><p-skeleton width="3rem" /></span
      ></span>
    </div>
  </div>`,
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardSkeletonComponent {}
