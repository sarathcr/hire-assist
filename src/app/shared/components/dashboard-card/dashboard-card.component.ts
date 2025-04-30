import { Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-dashboard-card',
  imports: [SkeletonModule],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardComponent {
  public title = input<string>('');
  public count = input<number>(0);
  public activeCount = input<number>(0);
  public inactiveCount = input<number>(0);
}
