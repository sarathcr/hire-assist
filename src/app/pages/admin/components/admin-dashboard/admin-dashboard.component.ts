import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardCardSkeletonComponent } from '../../../../shared/components/dashboard-card/dashboard-card-skeleton';
import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../shared/services/store.service';
import {
  Assessment,
  DashboardData,
  QuestionSet,
  Users,
} from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DashboardCardComponent, RouterLink, DashboardCardSkeletonComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  public assessmentData!: Assessment;
  public usersData!: Users;
  public questionSetData!: QuestionSet;
  constructor(
    private readonly dashboardService: DashboardService<DashboardData>,
    private readonly storeService: StoreService,
  ) {}

  // Lifecycle events
  ngOnInit(): void {
    this.getUserData();
  }

  // Private Methods
  private getUserData(): void {
    const userData = this.storeService.getUserData();
    if (userData.id) {
      this.getDashboardDetails(userData.id);
    }
  }
  private getDashboardDetails(id: string): void {
    const next = (res: DashboardData) => {
      this.assessmentData = res.data.assessment;
      this.usersData = res.data.users;
      this.questionSetData = res.data.questionSet;
    };
    const error = (error: ErrorResponse) => {
      console.log('ERROR', error);
    };
    this.dashboardService.getEntityById(id).subscribe({ next, error });
  }
}
