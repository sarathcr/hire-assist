import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
import { ButtonModule } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { Dialog } from 'primeng/dialog';
import { SafePipe } from '../../../../../../shared/pipes/safepipe';
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
  CandidateAptitudeReport,
  CandidateDetailRequest,
  Feedback,
  Feedbackcriteria,
  FileDto,
  FileRequest,
  Interview,
  InterviewerCandidate,
  InterviewerFeedback,
  PreviousInterview,
  QuestionAnswerDetail,
} from '../../../../../admin/models/interviewer.model';
import { InterviewerFeedbackSkeletonComponent } from './interviewer-feedback.skeleton';
import { INTERVIEW_URL } from '../../../../../../shared/constants/api';
import { CountdownTimerComponent } from '../../../../../../shared/components/countdown-timer/countdown-timer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { StatusEnum } from '../../../../../../shared/enums/status.enum';

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
    CountdownTimerComponent,
    ButtonModule,
    Dialog,
    Skeleton,
    SafePipe
  ],
  templateUrl: './interviewer-feedback.component.html',
  styleUrl: './interviewer-feedback.component.scss',
  standalone: true,
})
export class InterviewerFeedbackComponent
  extends BaseComponent
  implements OnInit, OnDestroy
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
  public totalFeedbackScore: number = 0;
  public previewImageUrls: Map<string, string> = new Map();
  public uploadedFile: FileDto[] = [];
  public pendingFiles: File[] = [];
  public pendingFilePreviews: string[] = [];
  public isLoading = true;
  public isInterviewerLoaded = false;
  public isFeedbackCriteriaLoaded = false;
  public isSubmitted = false;
  public isSubmitting = false;
  public savingCriteriaId: number | null = null;
  public responseData!: InterviewerCandidate;
  public feedbackRequest!: InterviewerFeedback;
  public isImageLoading = false;
  public isUploadingFiles = false;
  public isDragOver = false;
  public aptitudeReport: CandidateAptitudeReport | null = null;
  public isReportLoading = false;
  public showReport = false;
  public reportImages: Record<string, string> = {};
  public imageLoadingStates: Record<string, boolean> = {};

  // Viewer state
  public displayViewer = false;
  public viewerUrl = '';
  public viewerTitle = '';
  public isViewerPdf = false;
  public isViewerImage = false;

  public interview!: Interview;
  public durationSeconds = 0;
  public warningThresholds = [10, 5];
  private ref: any;

  // ── Track elapsed time ────────────────────────
  public elapsedSeconds = 0;
  public formattedDuration = '00:00:00';

  // ── Draggable timer state ────────────────────────
  public timerPos: { x: number; y: number } | null = null;
  public isDraggingTimer = false;
  private _timerDragOffset = { x: 0, y: 0 };
  private _timerMoveHandler?: (e: MouseEvent) => void;
  private _timerUpHandler?: () => void;

  constructor(
    private readonly interviewService: InterviewService,
    private readonly messageService: MessageService,
    private readonly route: ActivatedRoute,
    private readonly storeService: StoreService,
    public readonly dialog: DialogService,
    private readonly stepsStatusService: StepsStatusService,
    private readonly router: Router,
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
      this.previewImageUrls.clear();
      this.pendingFiles = [];
      this.pendingFilePreviews = [];

      this.feedbackcriteria = this.feedbackdetails.map((item) => {
        // Sort files if they exist to maintain consistent order in UI
        if (item.fileDto && item.fileDto.length > 0) {
          item.fileDto.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
          });
        }

        return {
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
          originalContent: item.comments ?? '',
          originalScore: item.score ?? null,
        };
      });
      this.feedbackcriteria.forEach((feedback) => {
        if (
          feedback.title === 'Attachments' &&
          feedback.fileDto &&
          feedback.fileDto.length > 0
        ) {
          this.uploadedFile = [...feedback.fileDto];
        }
      });
      this.calculateTotalFeedbackScore();
      this.loadAttachmentFiles();
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

  public handleTimerWarning(minutesRemaining: number): void {
    const modalData: DialogData = {
      message: `Only ${minutesRemaining} minutes remaining!`,
      isChoice: false,
      cancelButtonText: '',
      acceptButtonText: 'Continue',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Time Warning',
      maximizable: false,
      width: '25vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });
  }

  public handleTimeExpired(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Time Limit Reached',
      detail: 'The scheduled duration has ended.',
      life: 5000,
    });
  }

  public onTimeElapsed(seconds: number): void {
    this.elapsedSeconds = seconds;

    // update formatted duration
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    this.formattedDuration = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  public get savedCriteriaCount(): number {
    return this.feedbackcriteria.filter((fb) => this.isFeedbackComplete(fb))
      .length;
  }

  public isFeedbackComplete(fb: AccordionData): boolean {
    if (fb.title === 'Attachments') {
      return !!fb.isSaved;
    }
    return !!(
      fb.isSaved &&
      !this.hasChanges(fb) &&
      fb.score !== null &&
      fb.score !== undefined &&
      fb.content &&
      this.stripHtml(fb.content).trim() !== '' &&
      !fb.isScoreInValid
    );
  }

  public get isAllCriteriaMarked(): boolean {
    if (!this.feedbackcriteria || this.feedbackcriteria.length === 0) {
      return false;
    }
    return this.feedbackcriteria
      .filter((fb) => fb.title !== 'Attachments')
      .every((fb) => this.isFeedbackComplete(fb));
  }

  public getStatusText(statusId: number): string {
    const statusMap: Record<number, string> = {
      [StatusEnum.Active]: 'In Progress',
      [StatusEnum.Pending]: 'In Progress', // Mapped to In Progress as per request
      [StatusEnum.OnReview]: 'On Review',
      [StatusEnum.NotAttended]: 'Not Attended',
      [StatusEnum.Skip]: 'Skipped',
      [StatusEnum.Saved]: 'Saved',
      [StatusEnum.Completed]: 'Completed',
      [StatusEnum.Selected]: 'Selected',
      [StatusEnum.Rejected]: 'Rejected',
      [StatusEnum.Scheduled]: 'Scheduled',
      [StatusEnum.Paused]: 'Paused',
      [StatusEnum.Terminated]: 'Terminated',
      [StatusEnum.Quit]: 'Quit',
    };
    return statusMap[statusId] || '';
  }

  public getStatusSeverity(
    statusId: number,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severityMap: Record<
      number,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      [StatusEnum.Active]: 'warn',
      [StatusEnum.Pending]: 'warn',
      [StatusEnum.OnReview]: 'warn',
      [StatusEnum.NotAttended]: 'danger',
      [StatusEnum.Skip]: 'secondary',
      [StatusEnum.Saved]: 'success',
      [StatusEnum.Completed]: 'success',
      [StatusEnum.Selected]: 'success',
      [StatusEnum.Rejected]: 'danger',
      [StatusEnum.Scheduled]: 'warn',
      [StatusEnum.Paused]: 'secondary',
      [StatusEnum.Terminated]: 'danger',
      [StatusEnum.Quit]: 'secondary',
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
    const key = file.blobId || file.id;
    if (key && this.previewImageUrls.has(key)) {
      return this.previewImageUrls.get(key) || '';
    }
    // Check reportImages too as we use it for aptitude
    if (key && this.reportImages[key]) {
      return this.reportImages[key] || '';
    }
    return '';
  }

  public isImage(filename: string): boolean {
    if (!filename) return false;
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
  }

  public viewFile(file: FileDto): void {
    const key = file.id || file.blobId || '';
    const blobUrl = this.previewImageUrls.get(key) || this.reportImages[key];
    const filename = file.name || '';
    this.viewerTitle = file.attachmentName || filename;
    
    // Prioritize the blob URL if we already fetched it
    if (blobUrl) {
      if (this.isImage(filename)) {
        this.isViewerImage = true;
        this.isViewerPdf = false;
      } else {
        this.isViewerImage = false;
        this.isViewerPdf = true;
      }
      this.viewerUrl = blobUrl;
      this.displayViewer = true;
      return;
    }

    // Fallback if blob is not pre-fetched yet
    const type = file.attachmentType || 9; // Default for feedback attachments
    if (key) {
      this.fetchFileBlob(file);
      // We'll show a loading state in the UI while it fetches
      this.displayViewer = true;
      this.viewerUrl = ''; // Clear to trigger loading state
      
      if (this.isImage(filename)) {
        this.isViewerImage = true;
        this.isViewerPdf = false;
      } else {
        this.isViewerImage = false;
        this.isViewerPdf = true;
      }
      return;
    }

    // Last resort: raw URL if we have no key/blob
    if (file.url) {
      const fullUrl = file.url.startsWith('http') 
        ? file.url 
        : `${INTERVIEW_URL.replace('/api/interview', '')}/${file.url}`;
      window.open(fullUrl, '_blank');
    }
  }

  public fetchFileBlob(file: FileDto): void {
    const key = file.blobId || file.id;
    if (!key || this.previewImageUrls.has(key) || this.imageLoadingStates[key]) return;

    this.imageLoadingStates[key] = true;
    // Extract only the filename as some IDs contain folder paths
    const blobId = key.includes('/') ? key.split('/').pop()! : key;
    const type = file.attachmentType || 9;

    this.interviewService.GetFiles({ blobId: blobId, attachmentType: type }).subscribe({
      next: (blob: Blob) => {
        // Enforce correct MIME type based on extension to prevent auto-download
        let mimeType = blob.type;
        const filename = blobId.toLowerCase();
        
        if (filename.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.endsWith('.png')) {
          mimeType = 'image/png';
        }

        const safeBlob = new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(safeBlob);
        
        this.previewImageUrls.set(key, url);
        // Force a new Map reference to ensure Angular change detection
        this.previewImageUrls = new Map(this.previewImageUrls);
        
        this.imageLoadingStates[key] = false;
        
        // If this file is currently being viewed, update the viewerUrl
        if (this.displayViewer && !this.viewerUrl) {
          this.viewerUrl = url;
        }
      },
      error: () => {
        this.imageLoadingStates[key] = false;
      },
    });
  }

  public getCorrectAnswers(
    detail: AssessmentDetails & { correctAnswers?: number },
  ): number {
    return detail.correctAnswers ?? 0;
  }
  private getAssessmentDetails(payload: CandidateDetailRequest): void {
    const next = (res: InterviewerCandidate) => {
      this.responseData = res;
      this.isInterviewerLoaded = true;
      this.updateLoadingState();

      this.isSubmitted = res.isActive == false ? true : false;
      if (res.timerHour) {
        this.responseData.timerHour = res.timerHour;
        this.durationSeconds = this.convertTimerHourToSeconds(res.timerHour);
      }
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
  public onFileChange(event: any): void {
    const files = event.files || event.currentFiles || [];
    if (files && files.length > 0) {
      const newFiles: File[] = [];
      let hasLargeFile = false;
      let hasInvalidType = false;

      // 5MB limit: 5 * 1024 * 1024 = 5242880 bytes
      const MAX_SIZE = 5242880;
      // Only allow PNG and JPEG
      const ALLOWED_TYPES = ['image/png', 'image/jpeg'];

      Array.from(files).forEach((file: any) => {
        if (file) {
          // Validation: file type
          if (!ALLOWED_TYPES.includes(file.type)) {
            hasInvalidType = true;
            return;
          }
          // Validation: 5MB limit
          if (file.size > MAX_SIZE) {
            hasLargeFile = true;
            return;
          }

          const isDuplicate = this.pendingFiles.some(
            (pendingFile) =>
              pendingFile.name === file.name &&
              pendingFile.size === file.size &&
              pendingFile.lastModified === file.lastModified,
          );

          // Also check if file was already uploaded
          const isAlreadyUploaded = this.uploadedFile.some(
            (uploaded) => uploaded.name === file.name,
          );

          if (!isDuplicate && !isAlreadyUploaded) {
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

      if (hasInvalidType) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File Type',
          detail: 'Only PNG and JPG/JPEG files are allowed.',
          life: 5000,
        });
      }

      if (hasLargeFile) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'One or more files exceed the 5MB limit and were skipped.',
          life: 5000,
        });
      }

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

      // Auto-save: Upload pending files immediately
      if (newFiles.length > 0) {
        this.uploadAndSaveAttachments();
      }
    }
  }

  private uploadAndSaveAttachments(): void {
    // Guard against concurrent uploads
    if (this.isUploadingFiles) return;

    const attachmentFeedback = this.feedbackcriteria.find(
      (f) => f.title === 'Attachments',
    );
    if (!attachmentFeedback) return;

    this.uploadPendingFiles()
      .then((uploadedFiles: FileDto[]) => {
        if (uploadedFiles.length > 0) {
          // Reload feedback criteria to get proper file data from the server
          this.GetfeedbackCriteria();
        }
      })
      .catch((err) => {
        console.error('Upload failed', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload files',
        });
      });
  }

  public removePendingFile(index: number): void {
    if (index >= 0 && index < this.pendingFiles.length) {
      this.pendingFiles.splice(index, 1);
      this.pendingFilePreviews.splice(index, 1);
    }
  }

  private uploadPendingFiles(): Promise<FileDto[]> {
    return new Promise((resolve, reject) => {
      const totalFiles = this.pendingFiles.length;

      if (totalFiles === 0) {
        resolve([]);
        return;
      }

      this.isUploadingFiles = true;

      const attachmentFeedback = this.feedbackcriteria.find(
        (f) => f.title === 'Attachments',
      );
      const feedbackCriteriaId = attachmentFeedback
        ? attachmentFeedback.value
        : 6;
      const feedbackId = attachmentFeedback?.id ?? 0;

      const filesToUpload = [...this.pendingFiles];

      // Clear pending files immediately to prevent duplicate uploads
      this.pendingFiles = [];
      this.pendingFilePreviews = [];

      const uploadObservables = filesToUpload.map((file) =>
        this.interviewService.uploadAttachment({
          idType: 9,
          file: file,
          id: feedbackId,
          interviewerId: this.interviewerId ?? '',
          candidateId: this.candidateid ?? '',
          assessmentId: Number(this.assessmentId),
          feedbackCriteriaId: feedbackCriteriaId,
          feedbackDetails: '<p><p/>',
          feedbackScore: 0,
          assessmentRoundId: Number(this.assessmentRoundId),
          interviewId: Number(this.interviewId),
        }),
      );

      forkJoin(uploadObservables).subscribe({
        next: (responses) => {
          // Map raw API responses to FileDto objects
          const mappedFiles: FileDto[] = responses.map((res, index) => {
            const fileUrl = res.fileUrl || '';
            // Extract blob ID from fileUrl path (e.g. "interview/files/Work Sheet/3d25fdbd-...-596.png")
            const pathSegments = fileUrl.split('/');
            const blobFileName = pathSegments[pathSegments.length - 1] || '';
            const blobId = blobFileName.split('.')[0] || blobFileName;

            return {
              id: blobId,
              blobId: blobId,
              name: filesToUpload[index]?.name || blobFileName,
              path: fileUrl,
              url: fileUrl,
              attachmentType: 9,
            } as FileDto;
          });

          this.uploadedFile.push(...mappedFiles);
          this.isUploadingFiles = false;
          resolve(mappedFiles);
        },
        error: (err: unknown) => {
          this.isUploadingFiles = false;
          reject(err);
        },
      });
    });
  }

  private loadAttachmentFiles() {
    // iterate over uploadedFile (which was populated in GetFeedbackCriteria)
    // BUT wait, in GetFeedbackCriteria we are now NOT pushing to uploadedFile?
    // Ah, we need to populate this.uploadedFile from the feedback item if it's empty
    // OR just use the feedback item's fileDto directly.

    // Let's look at how uploadedFile is used. It seems it is a flattened list of all files?
    // Actually, in the previous code, it pushed all files from all feedback items to this.uploadedFile.
    // We should probably do that initialization in GetFeedbackCriteria BUT skip the previewImage call.

    // Let's correct the strategy:
    // 1. In GetFeedbackCriteria (previous step), we SHOULD populate this.uploadedFile but NOT call previewImage.
    //    Wait, I removed the loop entirely in the previous step. I should restore the population of this.uploadedFile
    //    but skip the previewImage call.

    //    Actually, let's look at the removed code:
    //    this.feedbackcriteria.forEach((feedback) => { ... this.uploadedFile.push(file) ... })

    //    If I removed that, this.uploadedFile is empty.
    //    I should fix that in the next step or re-add it here safely.

    //    Let's assume I will fix the population in a separate method or re-add it.
    //    For now, let's implement loadAttachmentFiles assuming files are in this.uploadedFile or feedback.fileDto.

    //    Actually, looking at the code, `uploadedFile` seems to be used for the file upload component and `removeImage`.
    //    It serves as the source of truth for the Attachments section.

    //    Let's re-populate it here if empty and "Attachments" exists.
    const attachmentFeedback = this.feedbackcriteria.find(
      (f) => f.title === 'Attachments',
    );
    if (attachmentFeedback && attachmentFeedback.fileDto) {
      // Ensure uploadedFile matches the attachments
      this.uploadedFile = [...attachmentFeedback.fileDto];

      this.uploadedFile.forEach((file) => {
        // Only fetch if not already fetched
        const key = file.id || file.blobId;
        if (key && !this.previewImageUrls.has(key)) {
          this.fetchFileBlob(file);
        }
      });
    }
  }

  public removeImage(index: number) {
    if (index >= 0 && index < this.uploadedFile.length) {
      const file = this.uploadedFile[index];
      const key = file.blobId || file.id;

      // Call API to delete
      this.interviewService.deleteFiles(file).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully',
          });

          if (key && this.previewImageUrls.has(key)) {
            this.previewImageUrls.delete(key);
          }
          this.uploadedFile.splice(index, 1);

          // Also update the feedback criteria object to reflect removal
          const attachmentFeedback = this.feedbackcriteria.find(
            (f) => f.title === 'Attachments',
          );
          if (attachmentFeedback && attachmentFeedback.fileDto) {
            const fileIdx = attachmentFeedback.fileDto.findIndex(
              (f) => f.id === file.id && f.blobId === file.blobId,
            );
            if (fileIdx !== -1) {
              attachmentFeedback.fileDto.splice(fileIdx, 1);
            }
            // Refresh feedback criteria to get current state from server
            this.GetfeedbackCriteria();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete file',
          });
        },
      });
    }
  }
  public validateScore(feedback: AccordionData) {
    feedback.isScoreInValid =
      feedback.score != null &&
      (feedback.score < 0 ||
        (feedback.maxScore != null && feedback.score > feedback.maxScore));
  }

  public preventInvalidInput(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }
  public onsave(feedback: AccordionData): void {
    const textContent = this.stripHtml(feedback.content || '').trim();
    const isCommentEmpty = !textContent;
    // Handle null, undefined, 0 (number), "0" (string), NaN, etc.
    const isScoreEmpty = !feedback.score || Number(feedback.score) === 0;
    const isAttachments = feedback.title?.toLowerCase() === 'attachments';

    if (!isAttachments && isCommentEmpty && isScoreEmpty) {
      const modalData: DialogData = {
        message:
          'Are you sure you want to save without adding any comments or score?',
        isChoice: true,
        cancelButtonText: 'No',
        acceptButtonText: 'Yes, Save',
      };

      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        header: 'Save Confirmation',
        width: '30vw',
        modal: true,
        focusOnShow: false,
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw',
        },
        templates: {
          footer: DialogFooterComponent,
        },
      });

      this.ref.onClose.subscribe((result: boolean) => {
        if (result) {
          this.executeSave(feedback);
        }
      });
    } else {
      this.executeSave(feedback);
    }
  }

  private executeSave(feedback: AccordionData): void {
    // If this is attachments section and there are pending files, upload them first
    if (feedback.title === 'Attachments' && this.pendingFiles.length > 0) {
      this.uploadPendingFiles()
        .then((uploadedFiles: FileDto[]) => {
          // Update local feedback.fileDto state so the UI updates
          if (!feedback.fileDto) {
            feedback.fileDto = [];
          }

          // Filter out duplicates based on blobId to prevent adding the same file twice
          const newUniqueFiles = uploadedFiles.filter(
            (newFile) =>
              !feedback.fileDto!.some(
                (existing) => existing.blobId === newFile.blobId,
              ),
          );

          if (newUniqueFiles.length > 0) {
            feedback.fileDto.push(...newUniqueFiles);

            // Fetch blobs for new files so they display correctly
            newUniqueFiles.forEach((file) => this.fetchFileBlob(file));

            // Save only the new unique files
            this.saveFeedback(feedback, newUniqueFiles);
          } else {
            this.saveFeedback(feedback, []);
          }
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
      this.saveFeedback(feedback, []);
    }
  }

  private saveFeedback(
    feedback: AccordionData,
    filesToSave: FileDto[],
    showToast: boolean = true,
  ): void {
    this.savingCriteriaId = feedback.value;
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
    // If updating, include the ID
    if (feedback.isSaved || feedback.id) {
      this.feedbackRequest.id = feedback.id;
    }

    this.calculateTotalFeedbackScore();

    const next = (res: InterviewerFeedback) => {
      if (showToast) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: feedback.isSaved
            ? 'Feedback Updated Successfully'
            : 'Feedback Saved Successfully',
        });
      }
      this.savingCriteriaId = null;
      feedback.isSaved = true;
      feedback.id = res.id ? res.id : feedback.id;

      // Update original values to match current saved values
      feedback.originalContent = feedback.content;
      feedback.originalScore = feedback.score;

      // If attachments were saved, reload feedback criteria to get proper file data with correct blob IDs
      if (feedback.title === 'Attachments') {
        this.GetfeedbackCriteria();
      }
    };
    const error = (error: CustomErrorResponse) => {
      const businerssErrorCode = error.error.businessError;
      if (businerssErrorCode === 4003) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Feedback already submitted',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save feedback', // Generic message or dynamic based on error
        });
      }
      this.savingCriteriaId = null;
    };

    if (feedback.isSaved || feedback.id) {
      this.interviewService
        .updateFeedback(this.feedbackRequest)
        .subscribe({ next, error });
    } else {
      this.interviewService
        .PostFeedback(this.feedbackRequest)
        .subscribe({ next, error });
    }
  }

  private convertTimerHourToSeconds(timerHour: number | string): number {
    if (!timerHour) return 0;

    if (typeof timerHour === 'string') {
      const isOvertime = timerHour.includes('+');
      const cleanHour = timerHour.replace('+', '').trim();
      const parts = cleanHour.split(':');
      const hours = parseInt(parts[0] || '0', 10);
      const minutes = parseInt(parts[1] || '0', 10);
      const seconds = parseInt(parts[2] || '0', 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return isOvertime ? -totalSeconds : totalSeconds;
    }

    const hours = Math.floor(timerHour);
    const minutes = Math.round((timerHour - hours) * 100);

    return hours * 3600 + minutes * 60;
  }

  public hasChanges(feedback: AccordionData): boolean {
    if (feedback.isScoreInValid) {
      return false;
    }

    // For attachments, we rely on duplicate checks in file upload, so button enabled if there are pending files
    if (feedback.title === 'Attachments') {
      return this.pendingFiles.length > 0;
    }

    // Normalized content comparison (strip HTML tags)
    const currentContent = this.stripHtml(feedback.content ?? '');
    const originalContent = this.stripHtml(feedback.originalContent ?? '');

    // Check if score changed
    const currentScore = feedback.score ?? null;
    const originalScore = feedback.originalScore ?? null;
    const scoreChanged = currentScore !== originalScore;

    // Check if content changed
    const contentChanged = currentContent !== originalContent;

    // If it's a new unsaved item, and both content and score are empty/null, it should be disabled
    // This handles the case where p-editor initializes with <p><br></p> which strips to empty
    if (!feedback.isSaved) {
      const isContentEmpty = currentContent.trim() === '';
      const isScoreEmpty = currentScore === null;

      if (isContentEmpty && isScoreEmpty) {
        return false;
      }
    }

    return contentChanged || scoreChanged;
  }

  public stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  public onSubmit() {
    this.isSubmitting = true;
    this.interview = {
      id: Number(this.interviewId),
      statusId: 7,
      hasAttachment: this.uploadedFile.length ? true : false,
      score: this.totalFeedbackScore,
    };
    const next = (res: Interview) => {
      this.isSubmitting = false;
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
      this.router.navigate([`/interviewer/`]);
    };
    const error = () => {
      this.isSubmitting = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No data Found',
      });
    };
    this.interviewService
      .UpdateInterview(Number(this.interviewId), this.interview)
      .subscribe({ next, error });
  }
  public onAccordionOpen(feedback: AccordionData): void {
    if (
      feedback.title === 'Attachments' &&
      feedback.fileDto &&
      feedback.fileDto.length > 0
    ) {
      feedback.fileDto.forEach((file) => {
        const key = file.blobId || file.id;
        if (key && !this.previewImageUrls.has(key)) {
          this.fetchFileBlob(file);
        }
      });
    }
  }

  public onPreviousRoundAccordionOpen(round: PreviousInterview): void {
    if (this.isAptitudeRound(round.roundName)) return;

    round.assessmentDetails?.forEach((detail: AssessmentDetails) => {
      detail.feedbackListDto?.forEach((feedback: Feedback) => {
        if (
          feedback.criteria === 'Attachments' &&
          feedback.fileDto &&
          feedback.fileDto.length > 0
        ) {
          feedback.fileDto.forEach((file: FileDto) => {
            const key = file.blobId || file.id;
            if (key && !this.previewImageUrls.has(key)) {
              file.attachmentType = file.attachmentType || 9;
              this.fetchFileBlob(file);
            }
          });
        }
      });
    });
  }

  // ── Draggable timer ────────────────────────────────
  public startTimerDrag(
    event: MouseEvent | TouchEvent,
    timerEl: HTMLElement,
  ): void {
    // Prevent default to avoid scrolling while dragging
    if (event.cancelable) {
      event.preventDefault();
    }

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    // On first drag, capture the element's current rendered position
    if (!this.timerPos) {
      const rect = timerEl.getBoundingClientRect();
      this.timerPos = { x: rect.left, y: rect.top };
    }

    this.isDraggingTimer = true;
    this._timerDragOffset.x = clientX - this.timerPos.x;
    this._timerDragOffset.y = clientY - this.timerPos.y;

    const timerW = timerEl.offsetWidth;
    const timerH = timerEl.offsetHeight;

    this._timerMoveHandler = (e: MouseEvent | TouchEvent) => {
      if (!this.isDraggingTimer || !this.timerPos) return;

      const moveX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const moveY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      // Clamp to viewport so it can't be dragged off screen
      this.timerPos = {
        x: Math.max(
          0,
          Math.min(window.innerWidth - timerW, moveX - this._timerDragOffset.x),
        ),
        y: Math.max(
          0,
          Math.min(
            window.innerHeight - timerH,
            moveY - this._timerDragOffset.y,
          ),
        ),
      };
    };

    this._timerUpHandler = () => {
      this.isDraggingTimer = false;
      document.removeEventListener('mousemove', this._timerMoveHandler! as any);
      document.removeEventListener('mouseup', this._timerUpHandler!);
      document.removeEventListener('touchmove', this._timerMoveHandler! as any);
      document.removeEventListener('touchend', this._timerUpHandler!);
    };

    document.addEventListener('mousemove', this._timerMoveHandler as any);
    document.addEventListener('mouseup', this._timerUpHandler);
    document.addEventListener('touchmove', this._timerMoveHandler as any, {
      passive: false,
    });
    document.addEventListener('touchend', this._timerUpHandler);
  }

  @HostListener('window:beforeunload')
  public onBeforeUnload(): void {
    if (this.isSubmitted || !this.assessmentId || !this.interviewId) {
      return;
    }

    const remainingSeconds = this.durationSeconds - this.elapsedSeconds;
    const isOvertime = remainingSeconds < 0;
    const absSeconds = Math.abs(remainingSeconds);

    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;

    const timeStr = `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const terminatedTimer = isOvertime ? `+ ${timeStr}` : timeStr;

    const url = `${INTERVIEW_URL}/InterviewerRefresh`;
    const payload = {
      assessmentId: Number(this.assessmentId),
      interviewId: Number(this.interviewId),
      terminatedTimer: terminatedTimer,
    };

    const token = this.storeService.getTokenData()?.accessToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use fetch with keepalive to ensure the request is sent even during unload
    fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }

  public override ngOnDestroy(): void {
    if (this._timerMoveHandler) {
      document.removeEventListener('mousemove', this._timerMoveHandler as any);
      document.removeEventListener('touchmove', this._timerMoveHandler as any);
    }
    if (this._timerUpHandler) {
      document.removeEventListener('mouseup', this._timerUpHandler);
      document.removeEventListener('touchend', this._timerUpHandler);
    }
    // Revoke object URLs for images to prevent memory leaks
    Object.values(this.reportImages).forEach((url) => URL.revokeObjectURL(url));
  }

  // ── Drag & Drop Handlers ───────────────────────────
  public onDragOver(event: DragEvent): void {
    if (this.isSubmitted) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  public onDragLeave(event: DragEvent): void {
    if (this.isSubmitted) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  public onDrop(event: DragEvent): void {
    if (this.isSubmitted) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = event.dataTransfer.files;
      this.onFileChange({ files });
    }
  }

  public fetchAptitudeReport(): void {
    if (this.aptitudeReport) {
      this.showReport = !this.showReport;
      return;
    }

    if (!this.assessmentId || !this.candidateid) return;

    this.isReportLoading = true;
    this.showReport = true;

    this.interviewService
      .getCandidateAptitudeReport(Number(this.assessmentId), this.candidateid)
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

  private fetchImage(id: string, type: number): void {
    if (!id || this.reportImages[id] || this.imageLoadingStates[id]) return;

    this.imageLoadingStates[id] = true;
    const blobId = id.includes('/') ? id.split('/').pop()! : id;

    this.interviewService.GetFiles({ blobId: blobId, attachmentType: type }).subscribe({
      next: (blob: Blob) => {
        // Enforce MIME type for aptitude report images too
        let mimeType = blob.type;
        const filename = blobId.toLowerCase();
        if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (filename.endsWith('.png')) mimeType = 'image/png';

        const safeBlob = new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(safeBlob);
        
        this.reportImages[id] = url;
        this.imageLoadingStates[id] = false;
      },
      error: () => {
        this.imageLoadingStates[id] = false;
      },
    });
  }

  public getStatusClass(ans: QuestionAnswerDetail): string {
    const status = ans.answerStatus?.toLowerCase().trim();
    const isCorrect = ans.markedAnswer?.trim() === ans.correctAnswer?.trim();

    if (isCorrect && ans.markedAnswer?.trim()) {
      return 'correct';
    }

    if (
      status === 'skipped' ||
      status === 'not attempted' ||
      !ans.markedAnswer?.trim()
    ) {
      return 'skipped';
    }

    return 'incorrect';
  }
}
