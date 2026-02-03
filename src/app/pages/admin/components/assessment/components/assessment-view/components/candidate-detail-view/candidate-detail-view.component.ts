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
  candidatePreviousAssessments,
} from '../../../../../../models/candidate-data.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { InterviewService } from '../../../../services/interview.service';
import { CandidateDetailPreviousAssessmentSkeletonComponent } from './candidate-detail-previous-assessment-skeleton';
import { CandidateDetailViewSkeletonComponent } from './candidate-detail-view-skeleton';
import { CandidateDetailHeaderSkeletonComponent } from './candidate-detail-header-skeleton';
import { EmptyStateComponent } from "../../../../../../../../shared/components/empty-state/empty-state/empty-state.component";

@Component({
  selector: 'app-candidate-detail-view',
  imports: [
    AccordionModule,
    DatePipe,
    TabsModule,
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
  public candidateAssessmentDataSource!: candidatePreviousAssessments[];
  public url = 'assessmentsummary';
  public editorStatus = true;
  public isLoading = true;
  public isLoadingPreviousAssessments = true;
  public isCoverImageLoading = false;

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
    this.isLoadingPreviousAssessments = true;
    
    this.assessmentId = Number(
      this.activatedRoute.snapshot.paramMap.get('recruitmentId'),
    );
    this.candidateId = String(
      this.activatedRoute.snapshot.paramMap.get('candidateId'),
    );
    this.getCandidateDetails();
  }

  public onTabChange(value: string | number): void {
    if (String(value) === '1' && !this.candidateAssessmentDataSource) {
      this.getPreviousAssessmentDetails();
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

  private getPreviousAssessmentDetails(): void {
    const next = (res: candidatePreviousAssessments[]) => {
      this.candidateAssessmentDataSource = res;
      this.isLoadingPreviousAssessments = false;
    };
    const error = () => {
      this.isLoadingPreviousAssessments = false;
    };
    this.interviewService
      .GetCandidateAssessmentDetails(this.candidateId, this.assessmentId)
      .subscribe({ next, error });
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
