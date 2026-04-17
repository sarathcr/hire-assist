import { CommonModule, DatePipe } from '@angular/common';
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
import { InterviewerCandidate, PreviousInterview, CandidateAptitudeReport, QuestionAnswerDetail, FileDto, AssessmentDetails, Feedback } from '../../../../../../models/interviewer.model';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { InterviewService } from '../../../../services/interview.service';
import { CandidateDetailViewSkeletonComponent } from './candidate-detail-view-skeleton';
import { CandidateDetailPreviousAssessmentSkeletonComponent } from './candidate-detail-previous-assessment-skeleton';
import { CandidateDetailHeaderSkeletonComponent } from './candidate-detail-header-skeleton';
import { EmptyStateComponent } from "../../../../../../../../shared/components/empty-state/empty-state/empty-state.component";
import { ImageComponent } from '../../../../../../../../shared/components/image';
import { ImageSkeletonComponent } from '../../../../../../../../shared/components/image/image-skeleton';
import { ButtonModule } from 'primeng/button';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-candidate-detail-view',
  imports: [
    CommonModule,
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
    EmptyStateComponent,
    ImageComponent,
    ImageSkeletonComponent,
    ButtonModule
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
  public isAadhaarVisible = false;
  public aptitudeReport: CandidateAptitudeReport | null = null;
  public isReportLoading = false;
  public showReport = false;
  public reportImages: Record<string, string> = {};
  public imageLoadingStates: Record<string, boolean> = {};

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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    Object.values(this.reportImages).forEach(url => URL.revokeObjectURL(url));
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

  public isAptitudeRound(roundName: string | undefined): boolean {
    if (!roundName) return false;
    return roundName.trim().toLowerCase().includes('aptitude');
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

  public toggleAadhaarVisibility(): void {
    this.isAadhaarVisible = !this.isAadhaarVisible;
  }

  public getMaskedAadhaar(aadhaar: string | undefined): string {
    if (!aadhaar) return 'N/A';
    const cleaned = aadhaar.replace(/\s/g, '');
    if (cleaned.length < 12) return aadhaar;
    return 'XXXX XXXX ' + cleaned.substring(cleaned.length - 4);
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

  public fetchAptitudeReport(): void {
    if (this.aptitudeReport) {
      this.showReport = !this.showReport;
      return;
    }

    this.isReportLoading = true;
    this.showReport = true;

    this.interviewService
      .getCandidateAptitudeReport(this.assessmentId, this.candidateDetailsDataSource.email)
      .subscribe({
        next: (res: CandidateAptitudeReport) => {
          this.aptitudeReport = res;
          this.isReportLoading = false;
          this.loadReportImages();
        },
        error: () => {
          this.isReportLoading = false;
          this.showReport = false;
        },
      });
  }

  private loadReportImages(): void {
    if (!this.aptitudeReport) return;

    this.aptitudeReport.answers.forEach((ans: QuestionAnswerDetail) => {
      // Question attachments (attachmentId = 7)
      ans.questionAttachments.forEach((id) => this.fetchImage(id, 7));

      // Option/Answer attachments (attachmentId = 8)
      ans.markedAnswerAttachments.forEach((id) => this.fetchImage(id, 8));
      ans.correctAnswerAttachments.forEach((id) => this.fetchImage(id, 8));
    });
  }

  public getImageId(file: FileDto): string {
    return file.id || file.blobId || '';
  }

  public onPreviousRoundAccordionOpen(round: PreviousInterview): void {
    if (round.roundName === 'APTITUDE ROUND') return;

    round.assessmentDetails?.forEach((detail: AssessmentDetails) => {
      detail.feedbackListDto?.forEach((feedback: Feedback) => {
        if (feedback.criteria === 'Attachments' && feedback.fileDto && feedback.fileDto.length > 0) {
          feedback.fileDto.forEach((file: FileDto) => {
            const key = this.getImageId(file);
            if (key && !this.reportImages[key]) {
              this.fetchImage(key, file.attachmentType || 9);
            }
          });
        }
      });
    });
  }

  private fetchImage(id: string, type: number): void {
    if (!id || this.reportImages[id] || this.imageLoadingStates[id]) return;

    this.imageLoadingStates[id] = true;
    // Extract only the filename as some IDs contain folder paths (e.g. "Option Image/")
    const blobId = id.includes('/') ? id.split('/').pop()! : id;

    this.interviewService.GetFiles({ blobId: blobId, attachmentType: type }).subscribe({
      next: (blob: Blob) => {
        this.reportImages[id] = URL.createObjectURL(blob);
        this.imageLoadingStates[id] = false;
        // Ensure reactivity
        this.reportImages = { ...this.reportImages };
      },
      error: () => {
        this.imageLoadingStates[id] = false;
      },
    });
  }

  public getAptitudeStatusSeverity(ans: QuestionAnswerDetail): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    const status = ans.answerStatus?.toLowerCase().trim();
    
    // Status tags for Attended (Saved), Marked for Review (On Review), and Not Attempted should be grey
    switch (status) {
      case 'saved':
      case 'on review':
      case 'marked for review':
      case 'not attempted':
        return 'secondary';
      case 'correct':
        return 'success';
      case 'incorrect':
      case 'skipped':
        return 'danger';
      default:
        return 'info';
    }
  }

  public getStatusClass(ans: QuestionAnswerDetail): string {
    const status = ans.answerStatus?.toLowerCase().trim();
    const isCorrect = ans.markedAnswer?.trim() === ans.correctAnswer?.trim();

    // If it's correct, return 'correct' regardless of other status details (unless it was skipped/not attempted)
    if (isCorrect && ans.markedAnswer?.trim()) {
      return 'correct';
    }

    // If it's skipped or not attempted, it's by definition not the correct answer (since it's empty)
    if (status === 'skipped' || status === 'not attempted' || !ans.markedAnswer?.trim()) {
      return 'skipped'; // These are mapped to red in SCSS now
    }

    // If it's not the same and not skipped, it's 'incorrect'
    return 'incorrect';
  }

  public getAptitudeStatusLabel(ans: QuestionAnswerDetail): string {
    const status = ans.answerStatus?.toLowerCase().trim();
    
    switch (status) {
      case 'saved':
        return 'Attended';
      case 'on review':
        return 'Marked as Review';
      default:
        return ans.answerStatus || 'N/A';
    }
  }
}
