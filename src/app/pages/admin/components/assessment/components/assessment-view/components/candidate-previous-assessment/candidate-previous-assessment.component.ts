import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { candidatePreviousAssessments } from '../../../../../../models/candidate-data.model';
import { InterviewService } from '../../../../services/interview.service';
import { CandidateDetailPreviousAssessmentSkeletonComponent } from '../candidate-detail-view/candidate-detail-previous-assessment-skeleton';
import { EmptyStateComponent } from '../../../../../../../../shared/components/empty-state/empty-state/empty-state.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-candidate-previous-assessment',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    CandidateDetailPreviousAssessmentSkeletonComponent,
    EmptyStateComponent,
    CardModule,
    ButtonModule,
  ],
  templateUrl: './candidate-previous-assessment.component.html',
  styleUrl: './candidate-previous-assessment.component.scss',
})
export class CandidatePreviousAssessmentComponent extends BaseComponent implements OnInit {
  public assessmentId!: number;
  public candidateId!: string;
  public candidateAssessmentDataSource!: candidatePreviousAssessments[];
  public isLoadingPreviousAssessments = true;

  constructor(
    public activatedRoute: ActivatedRoute,
    public interviewService: InterviewService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoadingPreviousAssessments = true;
    
    this.assessmentId = Number(
      this.activatedRoute.snapshot.paramMap.get('recruitmentId')
    );
    this.candidateId = String(
      this.activatedRoute.snapshot.paramMap.get('candidateId')
    );
    this.getPreviousAssessmentDetails();
  }

  private getPreviousAssessmentDetails(): void {
    const next = (res: candidatePreviousAssessments[]) => {
      this.candidateAssessmentDataSource = res || [];
      this.isLoadingPreviousAssessments = false;
    };
    const error = () => {
      this.isLoadingPreviousAssessments = false;
    };
    this.interviewService
      .GetCandidateAssessmentDetails(this.candidateId, this.assessmentId)
      .subscribe({ next, error });
  }

  public isAptitudeRound(round: any): boolean {
    if (!round) return false;
    const roundName = typeof round === 'string' ? round : round.roundName;
    const roundTypeId = typeof round === 'string' ? null : round.roundTypeId;
    const roundId = typeof round === 'string' ? null : round.roundId;

    if (roundTypeId === 1 || roundId === 1) return true;
    if (!roundName) return false;
    const nameLower = roundName.trim().toLowerCase();
    return nameLower.includes('aptitude') || nameLower.includes('online');
  }

  public navigateBack(): void {
    this.router.navigate(['admin/recruitments', this.assessmentId]);
  }
}
