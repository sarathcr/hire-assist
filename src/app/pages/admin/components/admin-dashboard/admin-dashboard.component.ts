import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../shared/services/store.service';
import {
  Assessment,
  DashboardData,
  Questions,
  Users,
} from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, ChartModule, CardModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  public assessmentData: Assessment = { total: 0, active: 0, inactive: 0 };
  public usersData: Users = { total: 0 };
  public questionsData: Questions = { total: 0 };
  public todayDate: string = '';
  public isLoadingDashboard: boolean = true;

  // Chart data
  public assessmentStatusChartData: any = null;
  public assessmentStatusChartOptions: any;
  public overviewChartData: any = null;
  public overviewChartOptions: any;

  // Computed properties
  get activePercentage(): number {
    if (this.assessmentData.total > 0) {
      return Math.round(
        (this.assessmentData.active / this.assessmentData.total) * 100,
      );
    }
    return 0;
  }

  constructor(
    private readonly dashboardService: DashboardService<DashboardData>,
    private readonly storeService: StoreService,
  ) {}

  // Lifecycle events
  ngOnInit(): void {
    this.setTodayDate();
    this.getUserData();
    this.initChartOptions();
  }

  private setTodayDate(): void {
    const today = new Date();
    this.todayDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Private Methods
  private getUserData(): void {
    const userData = this.storeService.getUserData();
    if (userData.id) {
      this.getDashboardDetails(userData.id);
    }
  }

  private getDashboardDetails(id: string): void {
    this.isLoadingDashboard = true;
    const next = (res: DashboardData) => {
      this.assessmentData = res.data.assessment;
      this.usersData = res.data.users;
      this.questionsData = res.data.questions;
      this.updateCharts();
      this.isLoadingDashboard = false;
    };
    const error = (error: ErrorResponse) => {
      this.isLoadingDashboard = false;
    };
    this.dashboardService.getEntityById(id).subscribe({ next, error });
  }

  private initChartOptions(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--text-color-secondary',
    );
    const surfaceBorder =
      documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

    // Assessment Status Chart (Doughnut)
    this.assessmentStatusChartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false, // We show legend separately
        },
        tooltip: {
          enabled: true,
        },
      },
      cutout: '70%',
    };

    // Overview Chart (Bar)
    this.overviewChartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              size: 11,
            },
          },
          grid: {
            color: surfaceBorder,
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
            font: {
              size: 11,
            },
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };
  }

  private updateCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor =
      documentStyle.getPropertyValue('--primary-color') || '#3b82f6';
    const successColor =
      documentStyle.getPropertyValue('--green-500') || '#10b981';
    const dangerColor =
      documentStyle.getPropertyValue('--red-500') || '#ef4444';

    // Assessment Status Chart Data
    this.assessmentStatusChartData = {
      labels: ['Active', 'Inactive'],
      datasets: [
        {
          data: [
            this.assessmentData?.active || 0,
            this.assessmentData?.inactive || 0,
          ],
          backgroundColor: [successColor, dangerColor],
          hoverBackgroundColor: [successColor, dangerColor],
        },
      ],
    };

    // Overview Chart Data
    this.overviewChartData = {
      labels: ['Recruitments', 'Users', 'Questions'],
      datasets: [
        {
          label: 'Total Count',
          data: [
            this.assessmentData?.total || 0,
            this.usersData?.total || 0,
            this.questionsData?.total || 0,
          ],
          backgroundColor: [
            primaryColor,
            successColor,
            documentStyle.getPropertyValue('--blue-500') || '#6366f1',
          ],
          borderRadius: 8,
        },
      ],
    };
  }
}
