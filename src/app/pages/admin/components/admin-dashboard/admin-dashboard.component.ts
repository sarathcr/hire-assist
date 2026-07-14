import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngClass etc if needed
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../shared/services/store.service';
import {
  Assessment,
  DashboardData,
  Questions,
  RecentActivity,
  Users,
} from '../../models/dashboard.model';
import { Assessment as AssessmentModel } from '../../models/assessment.model';
import { DashboardService } from '../../services/dashboard.service';
import { AssessmentService } from '../../services/assessment.service';
import { UserState } from '../../../../shared/models/user.models';
import { ProfileServicesService } from '../../../../shared/pages/profile/services/profile-services.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, ChartModule, CardModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  // Signals for state management
  public assessmentData = signal<Assessment | null>(null);
  public usersData = signal<Users | null>(null);
  public questionsData = signal<Questions | null>(null);
  public todayDate = signal<string>('');
  public isLoadingDashboard = signal<boolean>(true);
  public currentUser = signal<UserState | null>(null);

  // Pro Elements Signals (Mock Data)


  public recentActivities = signal<RecentActivity[]>([]);
  public expandedActivityIndex = signal<number | null>(null);

  public toggleActivityDetails(index: number): void {
    if (this.expandedActivityIndex() === index) {
      this.expandedActivityIndex.set(null);
    } else {
      this.expandedActivityIndex.set(index);
    }
  }

  public dismissActivity(event: Event, index: number): void {
    event.stopPropagation();
    const current = this.recentActivities();
    const updated = current.filter((_, i) => i !== index);
    this.recentActivities.set(updated);
    
    if (this.expandedActivityIndex() === index) {
      this.expandedActivityIndex.set(null);
    } else if (this.expandedActivityIndex() !== null && this.expandedActivityIndex()! > index) {
      this.expandedActivityIndex.set(this.expandedActivityIndex()! - 1);
    }
  }

  // NEW WIDGET SIGNALS 
  public upcomingInterviews = signal<{ candidate: string; role: string; time: string; interviewer: string; avatar: string; assessmentId: number; candidateId: string; interviewId: number; }[]>([]);

  // Real Data Signal for NEW Widget (Replaces System Health)
  public recentAssessments = signal<AssessmentModel[]>([]);

  // Chart Signals
  public assessmentStatusChartData = signal<any>(null);
  public assessmentStatusChartOptions = signal<any>(null);
  public overviewChartData = signal<any>(null);
  public overviewChartOptions = signal<any>(null);

  // Computed Properties
  public completedPercentage = computed(() => {
    const total = this.assessmentData()?.total || 0;
    const completed = this.assessmentData()?.completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  // Services
  private readonly dashboardService = inject(DashboardService) as DashboardService<DashboardData>;
  private readonly assessmentService = inject(AssessmentService);
  private readonly storeService = inject(StoreService);
  private readonly profileServices = inject(ProfileServicesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.setTodayDate();
    this.initChartOptions();
    this.getUserData();
  }

  private setTodayDate(): void {
    const today = new Date();
    this.todayDate.set(
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }

  private getUserData(): void {
    this.storeService.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      const userData = state.userState;
      this.currentUser.set(userData);
    });

    const initialUserData = this.storeService.getUserData();
    if (initialUserData?.id) {
      this.getDashboardDetails();
    }
  }

  private getDashboardDetails(): void {
    this.isLoadingDashboard.set(true);
    
    this.dashboardService
      .getDashboardDetails()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: DashboardData) => {
          this.assessmentData.set(res.data.assessment);
          this.usersData.set(res.data.users);
          this.questionsData.set(res.data.questions);
          
          if (res.data.recentActivities) {
            this.recentActivities.set(this.processRecentActivities(res.data.recentActivities));
          }
          
          if (res.data.upcomingInterviews) {
            const localInterviews = res.data.upcomingInterviews.map(interview => ({
              ...interview,
              time: this.convertUtcToLocal(interview.time)
            }));
            this.upcomingInterviews.set(localInterviews);
          }
          
          if (res.data.activeRecruitments) {
            this.recentAssessments.set(res.data.activeRecruitments as any);
          }

          if (res.data.userDetails) {
            // Note: Profile image loading is now handled centrally by dashboard.component.ts
            // We just update the user name in the store.
            const currentUserData = this.storeService.getUserData();
            if (currentUserData) {
              this.storeService.setUser(currentUserData.id, res.data.userDetails.name, currentUserData.role);
            }

            if (this.currentUser()) {
              this.currentUser.set({
                ...this.currentUser()!,
                name: res.data.userDetails.name
              });
            }
          }

          this.updateCharts();
          this.isLoadingDashboard.set(false);
        },
        error: (error: ErrorResponse) => {
          console.error('Error fetching dashboard data:', error);
          this.isLoadingDashboard.set(false);
        },
      });
  }

  /**
   * Processes recent activities to fix unknown assessment names if possible.
   */
  private processRecentActivities(activities: RecentActivity[]): RecentActivity[] {
    return activities.map(activity => {
      if (
        activity.assessmentName &&
        (activity.assessmentName.trim().toLowerCase() === 'unknown recruitment' ||
         activity.assessmentName.trim().toLowerCase() === 'unknown')
      ) {
        const textToParse = activity.details || activity.message || '';
        const match = textToParse.match(/Recruitment\s+['"“‘]([^'"”’]+)['"”’]/i);
        if (match && match[1]) {
          return {
            ...activity,
            assessmentName: match[1]
          };
        }
      }
      return activity;
    });
  }

  /**
   * Converts a backend UTC time string (e.g. "11:53 AM") into the user's local time string.
   */
  private convertUtcToLocal(utcTimeStr: string): string {
    if (!utcTimeStr) return utcTimeStr;
    
    const match = utcTimeStr.match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (!match) return utcTimeStr;

    let [ , hoursStr, minutesStr, modifier ] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);

    let localHours = date.getHours();
    const localMinutes = date.getMinutes();
    const localModifier = localHours >= 12 ? 'PM' : 'AM';

    if (localHours > 12) localHours -= 12;
    if (localHours === 0) localHours = 12;

    const formattedMinutes = localMinutes.toString().padStart(2, '0');
    const formattedHours = localHours.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes} ${localModifier}`;
  }



  private initChartOptions(): void {
    if (typeof getComputedStyle === 'undefined') return;

    // SCSS Colors (hardcoded here to ensure match without runtime computed style dependency issues)
    const textColorSecondary = '#64748b'; // muted
    const surfaceBorder = '#f1f5f9';      // border-light

    const fontConfig = {
      family: "'Inter', sans-serif",
      size: 11,
      weight: 500
    };

    // Assessment Doughnut Chart Options
    this.assessmentStatusChartOptions.set({
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#1e293b',
          padding: 12,
          titleFont: { family: "'Inter', sans-serif", size: 13 },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          cornerRadius: 8,
          displayColors: false,
        },
      },
      cutout: '75%', // Thinner elegant ring
      borderWidth: 2,
      borderColor: '#ffffff',
      layout: {
        padding: 20
      }
    });

    // Overview Bar Chart Options
    this.overviewChartOptions.set({
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          titleFont: { family: "'Inter', sans-serif", size: 13 },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: fontConfig,
            padding: 8
          },
          grid: {
            color: 'transparent',
            drawBorder: false,
          },
          border: { display: false }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            font: fontConfig,
            padding: 10,
            maxTicksLimit: 5
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
            tickLength: 0
          },
          border: { display: false }
        },
      },
      layout: {
        padding: { top: 20, bottom: 20, left: 10, right: 10 }
      },
      barPercentage: 0.6,
      categoryPercentage: 0.7
    });
  }

  private updateCharts(): void {
    // Premium Theme Colors
    const primaryColor = '#3b82f6';
    const successColor = '#10b981';
    const infoColor = '#6366f1';
    const dangerColor = '#ef4444';
    const activeColor = successColor;
    const inactiveColor = dangerColor;
    const completedColor = primaryColor; // Use primary color for completed

    // Active/Inactive Doughnut
    const activeCount = this.assessmentData()?.active || 0;
    const inactiveCount = this.assessmentData()?.inactive || 0;
    const completedCount = this.assessmentData()?.completed || 0;
    const hasData = (activeCount + inactiveCount + completedCount) > 0;

    this.assessmentStatusChartData.set({
      labels: hasData ? ['Active', 'Inactive', 'Completed'] : ['No Data'],
      datasets: [
        {
          data: hasData ? [activeCount, inactiveCount, completedCount] : [1],
          backgroundColor: hasData ? [activeColor, inactiveColor, completedColor] : ['#e2e8f0'],
          hoverBackgroundColor: hasData ? [activeColor, inactiveColor, completedColor] : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    });

    // Overview Bar Chart
    this.overviewChartData.set({
      labels: ['Recruitments', 'Users', 'Questions'],
      datasets: [
        {
          label: 'Total Count',
          data: [
            this.assessmentData()?.total || 0,
            this.usersData()?.total || 0,
            this.questionsData()?.total || 0,
          ],
          backgroundColor: [primaryColor, successColor, infoColor],
          hoverBackgroundColor: [primaryColor, successColor, infoColor],
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 40
        },
      ],
    });
  }

  public navigateTo(path: string | any[], state?: any): void {
    console.log('Navigating to:', path);
    const extras = state ? { state } : {};
    if (Array.isArray(path)) {
      this.router.navigate(path, extras);
    } else {
      this.router.navigate([path], extras);
    }
  }
}
