import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { EditorModule } from 'primeng/editor';
import { TabsModule } from 'primeng/tabs';
import { BaseComponent } from '../../../../../../../../shared/components/base/base.component';
import { ErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { candidateDetails } from '../../../../../../models/candidate-data.model';
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
import { Skeleton } from 'primeng/skeleton';
import { Dialog } from 'primeng/dialog';
import { SafePipe } from '../../../../../../../../shared/pipes/safepipe';
import { forkJoin, map } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

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
    ButtonModule,
    Skeleton,
    Dialog,
    SafePipe,
    NgxExtendedPdfViewerModule
],
  templateUrl: './candidate-detail-view.component.html',
  styleUrl: './candidate-detail-view.component.scss',
})
export class CandidateDetailViewComponent
  extends BaseComponent
  implements OnInit, OnDestroy
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
  public activeTab = '0';
  /** Per-round report data keyed by composite round key */
  public aptitudeReportMap: Record<string, CandidateAptitudeReport | null> = {};
  /** Per-round loading state keyed by composite round key */
  public isReportLoadingMap: Record<string, boolean> = {};
  /** Per-round visibility toggle keyed by composite round key */
  public showReportMap: Record<string, boolean> = {};
  public reportImages: Record<string, string> = {};
  public imageLoadingStates: Record<string, boolean> = {};
  public idProofsDataSource: FileDto[] = [];
  public isLoadingIdProofs = false;
  public lastCompletedRoundId!: number;
  
  // Viewer state
  public displayViewer = false;
  public viewerUrl = '';
  public rawFileUrl = '';
  public viewerTitle = '';
  public isViewerPdf = false;
  public isViewerImage = false;
  public pdfFailedToLoad = false;
  public isPdfRendering = false;
  public isPreparingFile = false;
  private createdBlobUrl: string | null = null;

  constructor(
    public activatedRoute: ActivatedRoute,
    public assessmentService: AssessmentService,
    public interviewService: InterviewService,
    private messageService: MessageService,
  ) {
    super();
    pdfDefaultOptions.disableRange = true;
    pdfDefaultOptions.disableStream = true;
  }

  override ngOnDestroy(): void {
    this.cleanCurrentBlobUrl();
    Object.values(this.reportImages).forEach((url) => URL.revokeObjectURL(url));
    super.ngOnDestroy();
  }

  private cleanCurrentBlobUrl(): void {
    if (this.createdBlobUrl) {
      URL.revokeObjectURL(this.createdBlobUrl);
      this.createdBlobUrl = null;
    }
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
    this.interviewId = Number(this.activatedRoute.snapshot.paramMap.get('interviewId')) || 0;
    this.assessmentRoundId = Number(this.activatedRoute.snapshot.queryParamMap.get('assessmentRoundId')) || 0;
    this.lastCompletedRoundId = Number(this.activatedRoute.snapshot.queryParamMap.get('lastCompletedRoundId')) || 0;

    if (this.assessmentRoundId > 0 || this.lastCompletedRoundId > 0 || this.interviewId > 0) {
      this.activeTab = '1';
    }

    this.getCandidateDetails();
  }


  public onTabChange(value: string | number): void {
    this.activeTab = String(value);
    if (this.activeTab === '1') {
      this.getInterviewFeedbacks();
    } else if (this.activeTab === '2') {
      this.getIdProofs();
    }
  }

  // Private Methods
  private getCandidateDetails(): void {
    const next = (res: candidateDetails) => {
      this.candidateDetailsDataSource = res;
      this.isLoading = false;
      if (this.activeTab === '1') {
        this.getInterviewFeedbacks();
      }
    };
    const error = () => {
      this.isLoading = false;
    };
    this.assessmentService
      .getCandidateDetails(this.candidateId, this.assessmentId)
      .subscribe({ next, error });
  }

  private getInterviewFeedbacks(): void {
    if (!this.candidateDetailsDataSource?.email) return;

    this.isLoadingInterviewFeedbacks = true;
    this.interviewService
      .GetCurrentAndPreviousRounds(
        this.candidateDetailsDataSource.email,
        this.assessmentId,
        this.lastCompletedRoundId || this.assessmentRoundId || 0,
      )
      .pipe(finalize(() => (this.isLoadingInterviewFeedbacks = false)))
      .subscribe({
        next: (res: PreviousInterview[]) => {
          this.interviewFeedbacksDataSource = res;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load interview feedbacks',
          });
        },
      });
  }

  private getIdProofs(): void {
    if (this.idProofsDataSource.length > 0) return;
    
    this.isLoadingIdProofs = true;
    this.assessmentService.getCandidateIdProof(this.candidateId).subscribe({
      next: (res: any) => {
        const proofs = res as FileDto[];
        this.idProofsDataSource = proofs;
        this.isLoadingIdProofs = false;
        
        // Fetch all attachments as Blobs
        this.idProofsDataSource.forEach(file => {
          const key = this.getImageId(file);
          if (key) {
            this.fetchFileBlob(key, file.attachmentType || 4);
          }
        });
      },
      error: () => {
        this.isLoadingIdProofs = false;
      }
    });
  }

  public isImage(filename: string): boolean {
    if (!filename) return false;
    const cleanName = filename.split('?')[0].toLowerCase();
    const ext = cleanName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '') ||
      ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].some(e => cleanName.includes(e));
  }

  public isPdf(filename: string): boolean {
    if (!filename) return false;
    const cleanName = filename.split('?')[0].toLowerCase();
    return cleanName.endsWith('.pdf') || cleanName.includes('.pdf');
  }

  public viewFile(file: FileDto): void {
    this.pdfFailedToLoad = false;
    this.cleanCurrentBlobUrl();
    
    const key = this.getImageId(file);
    const existingUrl = this.reportImages[key];
    const filename = file.name || file.attachmentName || file.url || key || '';
    this.viewerTitle = file.attachmentName || file.name || filename;
    
    // Prioritize the blob/pre-signed URL if we already fetched it
    if (existingUrl) {
      this.displayViewer = true;
      this.rawFileUrl = existingUrl;
      this.loadViewerContent(existingUrl, filename);
      return;
    }

    // Fallback if URL is not pre-fetched yet
    const fileAny = file as any;
    const type = file.attachmentType || fileAny.AttachmentType || fileAny.attachmentTypeId || fileAny.AttachmentTypeId || 4;
    if (key) {
      this.displayViewer = true;
      this.viewerUrl = '';
      this.isPreparingFile = true;
      this.fetchFileBlob(key, type, (url: string) => {
        this.rawFileUrl = url;
        this.loadViewerContent(url, filename);
      });
      return;
    }

    // Last resort: raw URL if we have no key/blob
    if (file.url) {
      const fullUrl = file.url.startsWith('http') 
        ? file.url 
        : `${this.assessmentService.getResourceUrl().replace('/api/assessment', '')}/${file.url}`;
      this.displayViewer = true;
      this.rawFileUrl = fullUrl;
      this.loadViewerContent(fullUrl, filename);
    }
  }

  private async loadViewerContent(url: string, filename: string): Promise<void> {
    this.isPreparingFile = true;
    this.viewerUrl = '';
    this.pdfFailedToLoad = false;

    // Check if URL is already a local blob URL
    if (url.startsWith('blob:')) {
      this.viewerUrl = url;
      const isPdf = this.isPdf(filename) || this.isPdf(url);
      this.isViewerPdf = isPdf;
      this.isViewerImage = !isPdf;
      this.isPdfRendering = isPdf;
      this.isPreparingFile = false;
      return;
    }

    try {
      // Standard HTTP GET fetch without Range headers to avoid CORS/streaming issues with S3
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fetch failed with HTTP status ${response.status}`);
      }
      const blob = await response.blob();

      // Read magic bytes to determine format directly from data
      const headerBuffer = await blob.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(headerBuffer);

      const isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
      const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;

      if (isJpeg || isPng || isGif || isWebp) {
        // Auto-detected image
        this.isViewerPdf = false;
        this.isViewerImage = true;
        this.isPdfRendering = false;
        const mimeType = isPng ? 'image/png' : isGif ? 'image/gif' : isWebp ? 'image/webp' : 'image/jpeg';
        this.cleanCurrentBlobUrl();
        this.createdBlobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
        this.viewerUrl = this.createdBlobUrl;
      } else if (isPdfMagic) {
        // Verified valid PDF: convert to in-memory blob URL for instantaneous local rendering
        this.isViewerImage = false;
        this.isViewerPdf = true;
        this.isPdfRendering = true;
        this.cleanCurrentBlobUrl();
        this.createdBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        this.viewerUrl = this.createdBlobUrl;
      } else {
        // Fallback by extension
        const isPdfByName = this.isPdf(filename) || this.isPdf(url);
        if (isPdfByName) {
          this.isViewerImage = false;
          this.isViewerPdf = true;
          this.isPdfRendering = true;
          this.cleanCurrentBlobUrl();
          this.createdBlobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          this.viewerUrl = this.createdBlobUrl;
        } else {
          this.isViewerPdf = false;
          this.isViewerImage = true;
          this.isPdfRendering = false;
          this.cleanCurrentBlobUrl();
          this.createdBlobUrl = URL.createObjectURL(blob);
          this.viewerUrl = this.createdBlobUrl;
        }
      }
    } catch (error) {
      console.warn('Could not pre-fetch file as blob, falling back to direct URL:', error);
      const isPdfByName = this.isPdf(filename) || this.isPdf(url);
      this.isViewerPdf = isPdfByName;
      this.isViewerImage = !isPdfByName;
      this.isPdfRendering = isPdfByName;
      this.viewerUrl = url;
    } finally {
      this.isPreparingFile = false;
    }
  }

  public closeViewer(): void {
    this.displayViewer = false;
    this.cleanCurrentBlobUrl();
    this.viewerUrl = '';
    this.rawFileUrl = '';
    this.isViewerPdf = false;
    this.isViewerImage = false;
    this.viewerTitle = '';
    this.pdfFailedToLoad = false;
    this.isPdfRendering = false;
    this.isPreparingFile = false;
  }

  public onPdfPageRendered(): void {
    this.isPdfRendering = false;
  }

  public onPdfLoaded(): void {
    // Fallback safeguard in case pageRendered doesn't fire
    setTimeout(() => {
      this.isPdfRendering = false;
    }, 1000);
  }

  public onPdfLoadingFailed(error: any): void {
    console.warn('PDF loading failed, falling back to direct open/download options:', error);
    this.isPdfRendering = false;
    this.pdfFailedToLoad = true;
  }

  public getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | undefined {
    switch (status?.toLowerCase()) {
      case 'selected':
        return 'success';
      case 'rejected':
      case 'terminated':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  }

  public getStatusSeverityFromString(
    status: string | undefined,
  ): 'success' | 'danger' | 'warn' | 'info' | undefined {
    if (!status) return undefined;
    switch (status?.toLowerCase()) {
      case 'selected':
        return 'success';
      case 'rejected':
      case 'terminated':
        return 'danger';
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  }

  public getRoundKey(round: any): string {
    if (!round) return '';
    if (round.interviewId) {
      return `interview_${round.interviewId}`;
    }
    const roundId = round.assessmentRoundId || round.roundId || round.sequence || '0';
    const attempt = round.attemptNumber ? `_attempt_${round.attemptNumber}` : '';
    return `round_${roundId}${attempt}`;
  }

  public getRoundAttemptLabel(round: any): string {
    if (!round) return '';
    if (round.attemptNumber) {
      return `Attempt ${round.attemptNumber}`;
    }
    return '';
  }

  public getFeedbackScoreSeverity(
    score: number | null | undefined,
    maxScore: number | null | undefined,
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

  public hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  public getDetailTotalScore(detail: any): number | null {
    if (this.hasValue(detail?.totalScore)) return Number(detail.totalScore);
    if (this.hasValue(detail?.score)) return Number(detail.score);
    if (detail?.feedbackListDto && detail.feedbackListDto.length > 0) {
      const sum = detail.feedbackListDto.reduce((acc: number, f: any) => acc + (Number(f.feedbackScore) || 0), 0);
      return sum;
    }
    return null;
  }

  public getDetailOutOfScore(detail: any): number | null {
    if (this.hasValue(detail?.outofScore)) return Number(detail.outofScore);
    if (this.hasValue(detail?.maxScore)) return Number(detail.maxScore);
    if (detail?.feedbackListDto && detail.feedbackListDto.length > 0) {
      const sum = detail.feedbackListDto.reduce((acc: number, f: any) => acc + (Number(f.maxScore) || 0), 0);
      return sum > 0 ? sum : null;
    }
    // Fallback for aptitude round if outofScore is missing from remote API
    if (
      this.hasValue(detail?.totalQuestions) &&
      Number(detail.totalQuestions) > 0 &&
      this.hasValue(detail?.correctAnswers) &&
      Number(detail.correctAnswers) > 0 &&
      this.hasValue(detail?.totalScore) &&
      Number(detail.totalScore) > 0
    ) {
      const markPerQuestion = Number(detail.totalScore) / Number(detail.correctAnswers);
      return Math.round(markPerQuestion * Number(detail.totalQuestions));
    }
    return null;
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

  public getDetailDate(detail: any, round?: any): string {
    const dateToFormat = detail?.date || round?.date;
    return this.formatDate(dateToFormat);
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

  public fetchAptitudeReport(round: PreviousInterview): void {
    if (!round) {
      console.warn('fetchAptitudeReport: round is undefined. Attempting to locate the aptitude round from data source.');
      const foundRound = this.interviewFeedbacksDataSource?.find(r => this.isAptitudeRound(r));
      if (foundRound) {
        round = foundRound;
      } else {
        console.error('fetchAptitudeReport: No aptitude round found in data source.');
        return;
      }
    }

    const key = this.getRoundKey(round);
    const roundId = round.assessmentRoundId;

    // Toggle off if already loaded
    if (this.aptitudeReportMap[key]) {
      this.showReportMap[key] = !this.showReportMap[key];
      return;
    }

    this.isReportLoadingMap[key] = true;
    this.showReportMap[key] = true;

    this.interviewService
      .getCandidateAptitudeReport(this.assessmentId, this.candidateDetailsDataSource.email, roundId, round.interviewId)
      .subscribe({
        next: (res: CandidateAptitudeReport) => {
          this.aptitudeReportMap[key] = res;
          this.isReportLoadingMap[key] = false;
          this.loadReportImagesForRound(res);
        },
        error: () => {
          this.isReportLoadingMap[key] = false;
          this.showReportMap[key] = false;
        },
      });
  }

  private loadReportImagesForRound(report: CandidateAptitudeReport): void {
    if (!report) return;

    report.answers.forEach((ans: QuestionAnswerDetail) => {
      // Question attachments (attachmentId = 7)
      ans.questionAttachments.forEach((id) => this.fetchFileBlob(id, 7));

      // Option/Answer attachments (attachmentId = 8)
      ans.markedAnswerAttachments.forEach((id) => this.fetchFileBlob(id, 8));
      ans.correctAnswerAttachments.forEach((id) => this.fetchFileBlob(id, 8));
    });
  }

  public getImageId(file: FileDto): string {
    return file.id || file.blobId || '';
  }

  public onPreviousRoundAccordionOpen(round: PreviousInterview): void {
    if (this.isAptitudeRound(round)) return;

    round.assessmentDetails?.forEach((detail: AssessmentDetails) => {
      detail.feedbackListDto?.forEach((feedback: Feedback) => {
        if (feedback.criteria === 'Attachments' && feedback.fileDto && feedback.fileDto.length > 0) {
          feedback.fileDto.forEach((file: FileDto) => {
            const key = this.getImageId(file);
            if (key && !this.reportImages[key]) {
              this.fetchFileBlob(key, file.attachmentType || 9);
            }
          });
        }
      });
    });
  }

  private fetchFileBlob(id: string, type: number, onSuccess?: (url: string) => void): void {
    if (!id) return;
    if (this.reportImages[id]) {
      if (onSuccess) onSuccess(this.reportImages[id]);
      return;
    }
    if (this.imageLoadingStates[id]) return;

    this.imageLoadingStates[id] = true;
    // Extract only the filename as some IDs contain folder paths (e.g. "Option Image/")
    const blobId = id.includes('/') ? id.split('/').pop()! : id;

    this.interviewService.GetFilesUrl({ blobId: blobId, attachmentType: type }).subscribe({
      next: (res) => {
        const url = res.url;
        this.reportImages[id] = url;
        this.imageLoadingStates[id] = false;
        
        if (onSuccess) {
          onSuccess(url);
        } else if (this.displayViewer && !this.viewerUrl) {
          this.rawFileUrl = url;
          this.loadViewerContent(url, id);
        }

        // Ensure reactivity
        this.reportImages = { ...this.reportImages };
      },
      error: () => {
        this.imageLoadingStates[id] = false;
        if (this.displayViewer && !this.viewerUrl) {
          this.isPreparingFile = false;
          this.pdfFailedToLoad = true;
        }
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
