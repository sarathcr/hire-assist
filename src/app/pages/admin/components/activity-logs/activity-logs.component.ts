import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../services/dashboard.service';
import { StoreService } from '../../../../shared/services/store.service';
import { DashboardData } from '../../models/dashboard.model';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, CardModule, SkeletonModule],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
  public activities = signal<any[]>([]);
  public isLoading = signal<boolean>(true);
  public isInitialLoading = signal<boolean>(true);
  public readonly activityLogSkeletonRows = [1, 2, 3, 4, 5];
  
  public totalRecords = signal<number>(0);
  
  private readonly dashboardService = inject(DashboardService) as DashboardService<any>;
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private lastLazyLoadEvent = '';

  ngOnInit(): void {
    // Initial load will be triggered by p-table lazy load event
  }

  public loadData(event: any): void {
    const eventSignature = `${event.first}-${event.rows}`;
    if (this.lastLazyLoadEvent === eventSignature && this.isLoading()) {
      return; // Prevent duplicate calls while already loading the same page
    }
    this.lastLazyLoadEvent = eventSignature;

    const pageNumber = Math.floor(event.first! / event.rows!) + 1;
    const pageSize = event.rows!;
    this.getActivityLogs(pageNumber, pageSize);
  }

  private getActivityLogs(pageNumber: number, pageSize: number): void {
    const userData = this.storeService.getUserData();
    if (userData?.id) {
      this.isLoading.set(true);
      
      const payload = {
        multiSortedColumns: [],
        filterMap: {},
        pagination: { pageNumber, pageSize }
      };

      this.dashboardService.paginationEntity<any>(`recent-activities?userId=${userData.id}`, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            this.activities.set(res.data || []);
            this.totalRecords.set(res.totalRecords || 0);
            this.isLoading.set(false);
            this.isInitialLoading.set(false);
          },
          error: (err: any) => {
            console.error('Error fetching logs', err);
            this.isLoading.set(false);
            this.isInitialLoading.set(false);
          }
        });
    } else {
      this.isLoading.set(false);
      this.isInitialLoading.set(false);
    }
  }
}
