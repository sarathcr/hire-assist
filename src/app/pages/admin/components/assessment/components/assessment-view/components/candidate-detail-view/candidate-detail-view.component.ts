import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { EditorModule } from 'primeng/editor';
import { TabsModule } from 'primeng/tabs';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import {
  candidateDetails,
} from '../../../../../../models/candidate-data.model';
import { InterviewerCandidate, PreviousInterview } from '../../../../../../models/interviewer.model';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { InterviewService } from '../../../../services/interview.service';
import { CandidateDetailViewSkeletonComponent } from './candidate-detail-view-skeleton';
import { CandidateDetailPreviousAssessmentSkeletonComponent } from './candidate-detail-previous-assessment-skeleton';
import { CandidateDetailHeaderSkeletonComponent } from './candidate-detail-header-skeleton';
import { EmptyStateComponent } from "../../../../../../../../shared/components/empty-state/empty-state/empty-state.component";

@Component({
  selector: 'app-candidate-detail-view',
  imports: [
    AccordionModule,
    DatePipe,
    TabsModule,
    TagModule,
    ChipModule,
    DividerModule,
    FormsModule,
    EditorModule,
    CandidateDetailViewSkeletonComponent,
    CandidateDetailPreviousAssessmentSkeletonComponent,
    CandidateDetailHeaderSkeletonComponent,
    EmptyStateComponent
],
  templateUrl: './candidate-detail-view.component.html',
  styleUrl: './candidate-detail-view.component.scss',
})
export class CandidateDetailViewComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentId!: number;
  public candidateId!: string;
  public candidateDetailsDataSource!: candidateDetails;
  public interviewFeedbacksDataSource?: PreviousInterview[];
  public url = 'assessmentsummary';
  public editorStatus = true;
  public isLoading = true;
  public isLoadingInterviewFeedbacks = true;
  public isCoverImageLoading = false;
  public interviewId!: number;
  public assessmentRoundId!: number;

  constructor(
    public activatedRoute: ActivatedRoute,
    public assessmentService: AssessmentService,
    public interviewService: InterviewService,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    // Ensure loading state is set before fetching data
    this.isLoading = true;
    
    this.assessmentId = Number(
      this.activatedRoute.snapshot.paramMap.get('recruitmentId'),
    );
    this.candidateId = String(
      this.activatedRoute.snapshot.paramMap.get('candidateId'),
    );
    this.interviewId = Number(
      this.activatedRoute.snapshot.paramMap.get('interviewId'),
    );
    this.assessmentRoundId = Number(
      this.activatedRoute.snapshot.queryParamMap.get('assessmentRoundId'),
    );
    this.getCandidateDetails();
  }

  public onTabChange(value: string | number): void {
    if (String(value) === '1') {
      this.getInterviewFeedbacks();
    }
  }

  // Private Methods
  private getCandidateDetails(): void {
    const next = (res: candidateDetails) => {
      this.candidateDetailsDataSource = res;
      this.isLoading = false;
    };
    const error = () => {
      this.isLoading = false;
    };
    this.assessmentService
      .getCandidateDetails(this.candidateId, this.assessmentId)
      .subscribe({ next, error });
  }

  private getInterviewFeedbacks(): void {
    this.isLoadingInterviewFeedbacks = true;
    this.interviewService
      .GetCurrentAndPreviousRounds(
        this.candidateId,
        this.assessmentId,
        this.assessmentRoundId || 0,
      )
      .subscribe({
        next: (res: PreviousInterview[]) => {
          this.interviewFeedbacksDataSource = res;
          this.isLoadingInterviewFeedbacks = false;
        },
        error: () => {
          this.isLoadingInterviewFeedbacks = false;
        },
      });
  }

  public getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | undefined {
    switch (status?.toLowerCase()) {
      case 'selected':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  }

  public getStatusSeverityFromString(status: string | undefined): 'success' | 'danger' | 'warn' | 'info' | undefined {
    if (!status) return undefined;
    switch (status?.toLowerCase()) {
      case 'selected':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  }

  public getFeedbackScoreSeverity(
    score: number | null | undefined,
    maxScore: number | null | undefined
  ): 'success' | 'warn' | 'danger' | 'info' {
    if (
      score === null ||
      score === undefined ||
      maxScore === null ||
      maxScore === undefined ||
      maxScore === 0
    ) {
      return 'info';
    }

    const percentage = (score / maxScore) * 100;

    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warn';
    return 'danger';
  }

  public formatDate(dateString: string | undefined | Date): string {
    if (!dateString) return 'N/A';
    return new DatePipe('en-US').transform(dateString, 'mediumDate') || 'N/A';
  }

  public isAptitudeRound(roundName: string): boolean {
    return roundName?.toLowerCase().includes('aptitude');
  }

  public hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  public formatLabel(label: string): string {
    if (!label) return '';
    
    // Handle camelCase by adding space before capitals
    let formatted = label.replace(/([A-Z])/g, ' $1');
    
    // Replace underscores and hyphens with spaces
    formatted = formatted.replace(/[_\-]+/g, ' ');
    
    // Capitalize each word and join
    return formatted
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  public getDetailDate(detail: any): string {
    return this.formatDate(detail.date);
  }

  public getCorrectAnswers(detail: any): number {
    return detail.correctAnswers || 0;
  }

  // Public method to update cover image
  public updateCoverImage(file: File): void {
    this.isCoverImageLoading = true;
    
    // TODO: Replace with actual cover image upload service call
    // Example implementation:
    // this.assessmentService.uploadCoverImage(file, this.candidateId, this.assessmentId)
    //   .subscribe({
    //     next: (response) => {
    //       // Update candidateDetailsDataSource with new cover image URL
    //       if (this.candidateDetailsDataSource) {
    //         this.candidateDetailsDataSource.coverImageUrl = response.imageUrl;
    //       }
    //       this.isCoverImageLoading = false;
    //     },
    //     error: () => {
    //       this.isCoverImageLoading = false;
    //     }
    //   });

    // For now, simulate the loading with a timeout
    // Remove this when implementing actual upload
    setTimeout(() => {
      this.isCoverImageLoading = false;
    }, 2000);
  }
}
