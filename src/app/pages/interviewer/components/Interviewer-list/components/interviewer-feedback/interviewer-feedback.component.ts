import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { DialogService } from 'primeng/dynamicdialog';
import { EditorModule } from 'primeng/editor';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { Knob } from 'primeng/knob';
import { Message } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { ImageSkeletonComponent } from '../../../../../../shared/components/image/image-skeleton';
import { ImageComponent } from '../../../../../../shared/components/image/image.component';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  ConfigMap,
  buildFormGroup,
} from '../../../../../../shared/utilities/form.utility';
import { InterviewService } from '../../../../../admin/components/assessment/services/interview.service';
import { StepsStatusService } from '../../../../../admin/components/assessment/services/steps-status.service';
import { Score } from '../../../../../admin/models/assessment.model';
import {
  AccordionData,
  AssessmentDetails,
  CandidateDetailRequest,
  Feedbackcriteria,
  FileDto,
  FileRequest,
  Interview,
  InterviewerCandidate,
  InterviewerFeedback,
} from '../../../../../admin/models/interviewer.model';
import { InterviewerFeedbackSkeletonComponent } from './interviewer-feedback.skeleton';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';

@Component({
  selector: 'app-interviewer-feedback',
  imports: [
    Knob,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    ToastModule,
    FileUploadModule,
    ImageComponent,
    ImageSkeletonComponent,
    Tooltip,
    Message,
    ButtonComponent,
    EditorModule,
    InterviewerFeedbackSkeletonComponent,
    CardModule,
    BadgeModule,
    ChipModule,
    TagModule,
    DividerModule,
  ],
  templateUrl: './interviewer-feedback.component.html',
  styleUrl: './interviewer-feedback.component.scss',
})
export class InterviewerFeedbackComponent
  extends BaseComponent
  implements OnInit
{
  public score = new Score();
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public interviewId!: string | null;
  public candidateid!: string | null;
  public assessmentRoundId!: string | null;
  public interviewerId!: string;
  public assessmentId!: string | null;
  public requestData!: CandidateDetailRequest;
  public feedbackdetails!: Feedbackcriteria[];
  public feedbackcriteria: AccordionData[] = [];
  public totalFeedbackScore!: number;
  public previewImageUrls: string[] = [];
  public uploadedFile: FileDto[] = [];
  public pendingFiles: File[] = [];
  public pendingFilePreviews: string[] = [];
  public isLoading = true;
  public isInterviewerLoaded = false;
  public isFeedbackCriteriaLoaded = false;
  public isSubmitted = false;
  public responseData!: InterviewerCandidate;
  public feedbackRequest!: InterviewerFeedback;
  public isImageLoading = false;
  public isUploadingFiles = false;
  public interview!: Interview;
  constructor(
    private readonly interviewService: InterviewService,
    private readonly messageService: MessageService,
    private readonly route: ActivatedRoute,
    private readonly storeService: StoreService,
    public readonly dialog: DialogService,
    private readonly stepsStatusService: StepsStatusService,
  ) {
    super();
    this.fGroup = buildFormGroup(this.score);
    this.setConfigMaps();
  }
  ngOnInit(): void {
    const param = this.route.snapshot.paramMap;
    this.extractRouteParams(param);
    this.subcribeToInterviewerId();
    this.getAssessmentDetails(this.requestData);
    this.GetfeedbackCriteria();
  }

  private setConfigMaps(): void {
    const { metadata } = new Score();
    this.configMap = metadata.configMap || {};
  }
  private subcribeToInterviewerId(): void {
    const sub = this.storeService.state$.subscribe((value) => {
      this.interviewerId = value.userState.id;
    });
    this.subscriptionList.push(sub);
  }

  private extractRouteParams(paramMap: ParamMap): void {
    this.candidateid = paramMap.get('email');
    this.assessmentId = paramMap.get('recruitmentId');
    this.interviewId = paramMap.get('interviewId');
    this.assessmentRoundId = paramMap.get('assessmentRoundId');

    if (this.candidateid && this.assessmentId && this.interviewId) {
      this.setRequestDataIfValid();
    }
  }
  private setRequestDataIfValid(): void {
    if (this.assessmentId && this.interviewId) {
      this.requestData = {
        assessmentId: Number(this.assessmentId),
        candidateId: this.candidateid ?? '',
        interviewId: Number(this.interviewId),
      };
    }
  }

  public GetfeedbackCriteria() {
    const next = (res: Feedbackcriteria[]) => {
      this.feedbackdetails = res;
      this.isFeedbackCriteriaLoaded = true;
      this.updateLoadingState();
      // Reset arrays
      this.uploadedFile = [];
      this.previewImageUrls = [];
      this.pendingFiles = [];
      this.pendingFilePreviews = [];

      this.feedbackcriteria = this.feedbackdetails.map((item) => ({
        title: item.criteria,
        value: item.id,
        content: item.comments ?? '',
        score: item.score ?? null,
        maxScore: item.maxScore ?? 10,
        isSaved:
          item.comments ||
          item.score ||
          (item.fileDto && item.fileDto.length > 0)
            ? true
            : false,
        isScoreInValid: false,
        id: item.feedbackId,
        fileDto: item.fileDto,
      }));
      this.calculateTotalFeedbackScore();
      this.feedbackcriteria.forEach((feedback) => {
        if (feedback.fileDto && feedback.fileDto.length > 0) {
          feedback.fileDto.forEach((file) => {
            this.uploadedFile.push(file);
            // Only preview as blob if file doesn't have URL from backend
            // Files from backend have URLs, new uploads have blobIds
            if (!file.url && (file.blobId || file.id)) {
              this.previewImage(file);
            }
          });
        }
      });
    };
    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });

      this.isFeedbackCriteriaLoaded = true;
      this.updateLoadingState();
    };
    this.interviewService
      .GetFeedbackCriteria(Number(this.interviewId), this.interviewerId)
      .subscribe({ next, error });
  }

  private updateLoadingState(): void {
    this.isLoading = !(
      this.isInterviewerLoaded && this.isFeedbackCriteriaLoaded
    );
  }
  private calculateTotalFeedbackScore(): void {
    this.totalFeedbackScore = this.feedbackcriteria
      .map((fb) => Number(fb.score) || 0) // Ensure numeric addition
      .reduce((acc, curr) => acc + curr, 0);
  }

  public getMaxTotalScore(): number {
    return this.feedbackcriteria
      .filter((fb) => fb.title !== 'Attachments')
      .reduce((acc, curr) => acc + (curr.maxScore || 0), 0);
  }

  public getStatusText(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: 'Pending',
      2: 'In Progress',
      3: 'Completed',
      4: 'Cancelled',
      5: 'Rejected',
      6: 'Selected',
      7: 'Submitted',
    };
    return statusMap[statusId] || 'Unknown';
  }

  public getStatusSeverity(
    statusId: number,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severityMap: Record<
      number,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      1: 'info',
      2: 'warn',
      3: 'success',
      4: 'danger',
      5: 'danger',
      6: 'success',
      7: 'success',
    };
    return severityMap[statusId] || 'secondary';
  }

  public getStatusSeverityFromString(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('selected') || statusLower.includes('completed')) {
      return 'success';
    }
    if (statusLower.includes('pending') || statusLower.includes('progress')) {
      return 'warn';
    }
    if (statusLower.includes('rejected') || statusLower.includes('cancelled')) {
      return 'danger';
    }
    return 'info';
  }

  public formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Checks if a round is an aptitude round
   * Returns true if the round name contains "aptitude" (case-insensitive)
   */
  public isAptitudeRound(roundName: string): boolean {
    if (!roundName) return false;
    return roundName.toLowerCase().includes('aptitude');
  }

  /**
   * Checks if a field has a valid value (not null, undefined, or empty string)
   */
  public hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  public getDetailDate(
    detail: AssessmentDetails & { date?: string | Date },
  ): string | Date | null {
    // Handle date field that may exist in API response but not in TypeScript interface
    return (detail as { date?: string | Date }).date || null;
  }

  public getFileUrl(file: FileDto): string {
    // If file has URL from backend, construct full URL if it's relative
    if (file.url) {
      const urlString =
        typeof file.url === 'string' ? file.url : String(file.url);
      // If it's already a full URL (starts with http or blob), return as-is
      if (
        urlString.startsWith('http://') ||
        urlString.startsWith('https://') ||
        urlString.startsWith('blob:')
      ) {
        return urlString;
      }
      // If it's a relative path, construct full URL using interview base URL
      // The file.url from API is like "interview/files/Work Sheet/..."
      // INTERVIEW_URL is like "https://...azurewebsites.net/api/interview"
      // Remove "interview/" prefix from path since INTERVIEW_URL already includes "/api/interview"
      let cleanPath = urlString.trim();
      if (cleanPath.startsWith('interview/')) {
        cleanPath = cleanPath.substring('interview/'.length);
      }
      // Ensure proper URL construction - remove trailing/leading slashes and combine
      const baseUrl = INTERVIEW_URL.trim().replace(/\/$/, ''); // Remove trailing slash
      const path = cleanPath.replace(/^\//, ''); // Remove leading slash
      return `${baseUrl}/${path}`;
    }
    // Fallback to blob URL from preview if available
    const fileIndex = this.uploadedFile.findIndex(
      (f) => f.id === file.id || f.blobId === file.blobId,
    );
    if (fileIndex >= 0 && fileIndex < this.previewImageUrls.length) {
      return this.previewImageUrls[fileIndex];
    }
    // If no preview URL but we have blobId, return empty (ImageComponent will handle it)
    return '';
  }

  public getCorrectAnswers(
    detail: AssessmentDetails & { correctAnswers?: number },
  ): number {
    // Handle both correctAnswers (from API response) and correctAswers (from TypeScript model typo)
    const detailAny = detail as {
      correctAnswers?: number;
      correctAswers?: number;
    };
    return detailAny.correctAnswers ?? detail.correctAswers ?? 0;
  }
  public previewImage(file: FileDto): void {
    this.interviewService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          const imageUrl = URL.createObjectURL(blob);
          this.previewImageUrls.push(imageUrl, ...this.previewImageUrls);
        },
      });
  }
  private getAssessmentDetails(payload: CandidateDetailRequest): void {
    const next = (res: InterviewerCandidate) => {
      this.responseData = res;
      this.isInterviewerLoaded = true;
      this.updateLoadingState();

      this.isSubmitted = res.isActive == false ? true : false;
    };
    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No data Found',
      });
      this.isInterviewerLoaded = true;
      this.updateLoadingState();
    };
    this.interviewService
      .GetCandidateDetails(payload)
      .subscribe({ next, error });
  }
  public onFileChange(event: FileSelectEvent): void {
    const files = event.currentFiles;
    if (files && files.length > 0) {
      const newFiles: File[] = [];

      files.forEach((file) => {
        if (file && file instanceof File) {
          const isDuplicate = this.pendingFiles.some(
            (pendingFile) =>
              pendingFile.name === file.name &&
              pendingFile.size === file.size &&
              pendingFile.lastModified === file.lastModified,
          );

          if (!isDuplicate) {
            newFiles.push(file);
            this.pendingFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              if (
                e.target?.result &&
                typeof e.target.result === 'string' &&
                !this.pendingFilePreviews.includes(e.target.result)
              ) {
                this.pendingFilePreviews.push(e.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      });

      // Clear file upload component after a short delay
      setTimeout(() => {
        const fileUploadElement = document.querySelector('p-fileupload');
        const fileUploadContext = (
          fileUploadElement as { __ngContext__?: unknown[] } | null
        )?.__ngContext__;
        const fileUploadComponent = Array.isArray(fileUploadContext)
          ? fileUploadContext.find(
              (item): item is { clear?: () => void } =>
                typeof item === 'object' && item !== null && 'clear' in item,
            )
          : undefined;
        if (fileUploadComponent?.clear) {
          fileUploadComponent.clear();
        }
      }, 100);
    }
  }

  public removePendingFile(index: number): void {
    if (index >= 0 && index < this.pendingFiles.length) {
      this.pendingFiles.splice(index, 1);
      this.pendingFilePreviews.splice(index, 1);
    }
  }

  private uploadPendingFiles(): Promise<FileDto[]> {
    return new Promise((resolve, reject) => {
      const uploadedFiles: FileDto[] = [];
      let uploadCount = 0;
      const totalFiles = this.pendingFiles.length;

      if (totalFiles === 0) {
        resolve(uploadedFiles);
        return;
      }

      this.isUploadingFiles = true;

      this.pendingFiles.forEach((file) => {
        const payload: FileRequest = {
          attachmentType: 9,
          file: file,
        };

        this.interviewService.uploadFiles(payload).subscribe({
          next: (uploadedFile: FileDto) => {
            uploadedFiles.push(uploadedFile);
            uploadCount++;
            if (uploadCount === totalFiles) {
              this.uploadedFile.push(...uploadedFiles);
              this.pendingFiles = [];
              this.pendingFilePreviews = [];
              this.isUploadingFiles = false;
              resolve(uploadedFiles);
            }
          },
          error: (error) => {
            this.isUploadingFiles = false;
            reject(error);
          },
        });
      });
    });
  }
  public removeImage(index: number) {
    if (index >= 0 && index < this.previewImageUrls.length) {
      this.previewImageUrls.splice(index, 1);
      if (index < this.uploadedFile.length) {
        this.uploadedFile.splice(index, 1);
      }
    }
  }
  public validateScore(feedback: AccordionData) {
    feedback.isScoreInValid =
      feedback.score != null &&
      feedback.maxScore != null &&
      feedback.score > feedback.maxScore;
  }
  public onsave(feedback: AccordionData): void {
    // If this is attachments section and there are pending files, upload them first
    if (feedback.title === 'Attachments' && this.pendingFiles.length > 0) {
      this.uploadPendingFiles()
        .then((uploadedFiles: FileDto[]) => {
          // After files are uploaded, save the feedback
          this.saveFeedback(feedback, uploadedFiles);
        })
        .catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload files',
          });
        });
    } else {
      // No pending files, save directly
      const existingFiles =
        feedback.title === 'Attachments' ? this.uploadedFile : [];
      this.saveFeedback(feedback, existingFiles);
    }
  }

  private saveFeedback(feedback: AccordionData, filesToSave: FileDto[]): void {
    this.feedbackRequest = {
      assessmentId: Number(this.assessmentId),
      candidateId: this.candidateid ?? '',
      //here if the feedback contains the files then criteria must be Attachments By default
      feedbackCriteriaId: feedback.title === 'Attachments' ? 6 : feedback.value,
      interviewerId: this.interviewerId ?? '',
      feedbackDetails: feedback.content ?? '',
      feedbackScore: feedback.score ?? 0,
      assessmentRoundId: Number(this.assessmentRoundId),
      interviewId: Number(this.interviewId),
      fileDto:
        feedback.title === 'Attachments' && filesToSave.length > 0
          ? filesToSave
          : [],
    };
    this.calculateTotalFeedbackScore();

    const next = (res: InterviewerFeedback) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Feedback Saved Successfully',
      });
      this.isLoading = false;
      feedback.isSaved = true;
      feedback.id = res.id ? res.id : 0;

      // Update feedback item with saved fileDto if attachments
      if (feedback.title === 'Attachments' && res.fileDto) {
        feedback.fileDto = res.fileDto;
      }
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode === 4003) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid Score',
        });
      }
      this.isLoading = false;
    };
    this.interviewService
      .PostFeedback(this.feedbackRequest)
      .subscribe({ next, error });
  }
  public onEdit(feedback: AccordionData) {
    // When editing, don't change isSaved status - user can modify and save again
    // Clear any existing feedback request
    this.feedbackRequest = {
      assessmentId: Number(this.assessmentId),
      candidateId: this.candidateid ?? '',
      feedbackCriteriaId: feedback.value,
      interviewerId: this.interviewerId ?? '',
      id: feedback.id,
      feedbackDetails: feedback.content ?? '',
      feedbackScore: feedback.score ?? 0,
      assessmentRoundId: Number(this.assessmentRoundId),
      interviewId: Number(this.interviewId),
      fileDto:
        feedback.title === 'Attachments' && this.uploadedFile.length
          ? this.uploadedFile
          : [],
    };
    feedback.isSaved = false;
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Feedback Updated Successfully',
      });
      this.isLoading = false;
      feedback.isSaved = true;
      this.isImageLoading = true;
      if (feedback.fileDto && feedback.fileDto.length > 0) {
        this.GetfeedbackCriteria();
      }
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode === 4003) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid Score',
        });
      }
      this.isLoading = false;
    };
    this.interviewService
      .updateFeedback(this.feedbackRequest)
      .subscribe({ next, error });
  }
  public onSubmit() {
    this.interview = {
      id: Number(this.interviewId),
      statusId: 7,
      hasAttachment: this.uploadedFile.length ? true : false,
      score: this.totalFeedbackScore,
    };
    const next = (res: Interview) => {
      this.messageService.add({
        severity: 'success',
        summary: 'success',
        detail: 'Submitted Successfully',
      });
      this.isSubmitted = res.isActive == false ? true : false;
      this.getAssessmentDetails(this.requestData);
      const assessmentId = Number(this.assessmentId);
      if (assessmentId && this.stepsStatusService) {
        this.stepsStatusService.notifyStepStatusUpdate(assessmentId);
      }
    };
    const error = () => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No data Found',
      });
      this.isLoading = false;
    };
    this.interviewService
      .UpdateInterview(Number(this.interviewId), this.interview)
      .subscribe({ next, error });
  }
}
