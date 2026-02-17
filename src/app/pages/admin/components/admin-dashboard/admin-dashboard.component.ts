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
import { RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngClass etc if needed
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../shared/services/store.service';
import {
  Assessment,
  DashboardData,
  Questions,
  Users,
} from '../../models/dashboard.model';
import { Assessment as AssessmentModel } from '../../models/assessment.model';
import { DashboardService } from '../../services/dashboard.service';
import { AssessmentService } from '../../services/assessment.service';
import { UserState } from '../../../../shared/models/user.models';

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
  public assessmentData = signal<Assessment>({ total: 0, active: 0, inactive: 0 });
  public usersData = signal<Users>({ total: 0 });
  public questionsData = signal<Questions>({ total: 0 });
  public todayDate = signal<string>('');
  public isLoadingDashboard = signal<boolean>(true);
  public currentUser = signal<UserState | null>(null);

  // Pro Elements Signals (Mock Data)


  public recentActivities = signal<{ message: string; time: string; type: 'primary' | 'success' | 'danger' | 'info'; icon: string }[]>([
    { message: '<strong>John Doe</strong> created a new recruitment drive "Senior Java Dev".', time: '2 hours ago', type: 'primary', icon: 'pi pi-briefcase' },
    { message: '<strong>Sarah Smith</strong> joined the platform as a Recruiter.', time: '5 hours ago', type: 'success', icon: 'pi pi-user' },
    { message: 'System automated backup completed successfully.', time: '1 day ago', type: 'info', icon: 'pi pi-cloud-upload' },
    { message: '<strong>Admin</strong> updated question bank "React Basics".', time: '1 day ago', type: 'primary', icon: 'pi pi-file-edit' },
    { message: 'Failed login attempt detected from IP 192.168.1.1.', time: '2 days ago', type: 'danger', icon: 'pi pi-shield' },
  ]);

  // NEW WIDGET SIGNALS 
  public upcomingInterviews = signal<{ candidate: string; role: string; time: string; interviewer: string; avatar: string }[]>([
    { candidate: 'Alice Johnson', role: 'Frontend Dev', time: '10:30 AM', interviewer: 'Sarah Smith', avatar: 'AJ' },
    { candidate: 'Michael Chen', role: 'Backend Dev', time: '02:00 PM', interviewer: 'John Doe', avatar: 'MC' },
    { candidate: 'Emma Wilson', role: 'Product Manager', time: '04:15 PM', interviewer: 'Emily Davis', avatar: 'EW' },
  ]);

  // Real Data Signal for NEW Widget (Replaces System Health)
  public recentAssessments = signal<AssessmentModel[]>([]);

  // Chart Signals
  public assessmentStatusChartData = signal<any>(null);
  public assessmentStatusChartOptions = signal<any>(null);
  public overviewChartData = signal<any>(null);
  public overviewChartOptions = signal<any>(null);

  // Computed Properties
  public activePercentage = computed(() => {
    const total = this.assessmentData().total;
    const active = this.assessmentData().active;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  });

  // Services
  private readonly dashboardService = inject(DashboardService) as DashboardService<DashboardData>;
  private readonly assessmentService = inject(AssessmentService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.setTodayDate();
    this.initChartOptions();
    this.getUserData();
    this.getRecentAssessments();
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
    const userData = this.storeService.getUserData();
    this.currentUser.set(userData);
    if (userData?.id) {
      this.getDashboardDetails(userData.id);
    }
  }

  private getDashboardDetails(id: string): void {
    this.isLoadingDashboard.set(true);
    
    this.dashboardService
      .getEntityById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: DashboardData) => {
          this.assessmentData.set(res.data.assessment);
          this.usersData.set(res.data.users);
          this.questionsData.set(res.data.questions);
          this.updateCharts();
          this.isLoadingDashboard.set(false);
        },
        error: (error: ErrorResponse) => {
          console.error('Error fetching dashboard data:', error);
          this.isLoadingDashboard.set(false);
        },
      });
  }

  // Fetch Real Assessments using AUTHORIZED endpoint
  private getRecentAssessments(): void {
    this.assessmentService.getDashboardAssessments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          // If response contains paginated data structure
          let assessments: AssessmentModel[] = [];
          
          if (response && response.data && Array.isArray(response.data)) {
            assessments = response.data;
          } else if (Array.isArray(response)) {
            // Fallback if it returns array directly
            assessments = response;
          }

          // Just take active ones, assuming API returned them correctly
          // We can also sort/filter if the API didn't do it fully, but the payload asked for it (sort of).
          // Assuming backend handles pagination and returns latest based on default sort.
          // Still good to slice to 5 just in case.
          
          const recent = assessments.slice(0, 5);
          this.recentAssessments.set(recent);
        },
        error: (err) => console.error('Error fetching assessments', err)
      });
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
      borderWidth: 0,
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
    const inactiveColor = '#f1f5f9'; // Very light gray for clean look

    // Active/Inactive Doughnut
    this.assessmentStatusChartData.set({
      labels: ['Active', 'Inactive'],
      datasets: [
        {
          data: [
            this.assessmentData().active || 0,
            this.assessmentData().inactive || 0,
          ],
          backgroundColor: [activeColor, inactiveColor],
          hoverBackgroundColor: [activeColor, '#e2e8f0'],
          borderWidth: 0,
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
            this.assessmentData().total || 0,
            this.usersData().total || 0,
            this.questionsData().total || 0,
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
}
