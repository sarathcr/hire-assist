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

  constructor(
    private activatedRoute: ActivatedRoute,
    private assessmentService: AssessmentService,
    private interviewService: InterviewService,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.assessmentId = Number(
      this.activatedRoute.snapshot.paramMap.get('recruitmentId'),
    );
    this.candidateId = String(
      this.activatedRoute.snapshot.paramMap.get('candidateId'),
    );
    this.getCandidateDetails();
    this.getPreviousAssessmentDetails();
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
}
