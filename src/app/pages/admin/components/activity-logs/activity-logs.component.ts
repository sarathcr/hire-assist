import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../services/dashboard.service';
import { StoreService } from '../../../../shared/services/store.service';
import { DashboardData } from '../../models/dashboard.model';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, CardModule],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
  public activities = signal<any[]>([]);
  public isLoading = signal<boolean>(true);
  
  private readonly dashboardService = inject(DashboardService) as DashboardService<DashboardData>;
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.getActivityLogs();
  }

  private getActivityLogs(): void {
    const userData = this.storeService.getUserData();
    if (userData?.id) {
      this.isLoading.set(true);
      this.dashboardService.getEntityById(userData.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.activities.set(res.data.recentActivities || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error fetching logs', err);
            this.isLoading.set(false);
          }
        });
    }
  }
}
