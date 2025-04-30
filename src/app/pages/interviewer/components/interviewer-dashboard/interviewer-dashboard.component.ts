import { Component, OnInit } from '@angular/core';
import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import {
  Assessment,
  DashboardData,
} from '../../../admin/models/dashboard.model';
import { DashboardService } from '../../../admin/services/dashboard.service';
import { StoreService } from '../../../../shared/services/store.service';
import { ErrorResponse } from '../../../../shared/models/custom-error.models';
import { InterviewerAssessmentService } from '../../services/interviewer-assessment.service';

@Component({
  selector: 'app-interviewer-dashboard',
  imports: [DashboardCardComponent],
  templateUrl: './interviewer-dashboard.component.html',
  styleUrl: './interviewer-dashboard.component.scss',
})
export class InterviewerDashboardComponent implements OnInit {
  public assessmentData!: Assessment;

  constructor(
    private dashboardService: DashboardService<DashboardData>,
    private storeService: StoreService,
    private interviewerAssessmentService: InterviewerAssessmentService,
  ) {}

  // Life Cycle Hooks
  ngOnInit(): void {
    this.getInterviewerDashboardDetails();
    this.getUserData();
  }

  // Private Methods
  private getInterviewerDashboardDetails(): void {
    const next = (res: DashboardData) => {
      this.assessmentData = res.data.assessment;
    };
    const error = (error: ErrorResponse) => {
      console.log('ERROR', error);
    };
    const resourceUrl = this.interviewerAssessmentService.getResourceUrl();
    this.interviewerAssessmentService.getEntityById(resourceUrl).subscribe({
      next,
      error,
    });
    console.log('Resource URL:', resourceUrl);
  }

  private getUserData(): void {
    const userData = this.storeService.getUserData();
    if (userData.id) {
      console.log('userData', userData);

      this.getDashboardDetails(userData.id);
    }
  }

  private getDashboardDetails(id: string): void {
    const next = (res: DashboardData) => {
      this.assessmentData = res.data.assessment;
    };
    const error = (error: ErrorResponse) => {
      console.log('ERROR', error);
    };
    this.dashboardService.getEntityById(id).subscribe({ next, error });
  }
}
