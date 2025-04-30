import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../shared/services/store.service';
import {
  Assessment,
  DashboardData,
  QuestionSet,
  Users,
} from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DashboardCardComponent, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  public assessmentData!: Assessment;
  public usersData!: Users;
  public questionSetData!: QuestionSet;
  constructor(
    private dashboardService: DashboardService<DashboardData>,
    private storeService: StoreService,
  ) { }

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
