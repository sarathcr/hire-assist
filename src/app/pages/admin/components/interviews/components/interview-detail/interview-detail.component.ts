import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DividerModule } from 'primeng/divider';
import { EditorModule } from 'primeng/editor';
import { FileSelectEvent, FileUpload } from 'primeng/fileupload';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Knob } from 'primeng/knob';
import { Message } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { Score } from '../../../../models/assessment.model';
import {
  AccordionData,
  CandidateDetailRequest,
  Feedbackcriteria,
  FileDto,
  FileRequest,
  Interview,
  InterviewerCandidate,
  InterviewerFeedback,
  RoundsAccordion,
} from '../../../../models/interviewer.model';
import { InterviewService } from '../../../assessment/services/interview.service';
import { InterviewDetailSkeletonComponent } from './interview-detail-skeleton';
import { ImageComponent } from '../../../../../../shared/components/image';
import { ImageSkeletonComponent } from '../../../../../../shared/components/image/image-skeleton';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { CandidatePayload, CandidateData } from '../../../../models/stepper.model';
import { PaginatedData } from '../../../../../../shared/models/pagination.models';
import { FilterMap } from '../../../../../../shared/models/pagination.models';

@Component({
  selector: 'app-interview-detail',
  imports: [
    AccordionModule,
    CommonModule,
    ReactiveFormsModule,
    EditorModule,
    FormsModule,
    ButtonComponent,
    CardModule,
    FileUpload,
    ToastModule,
    ButtonModule,
    Knob,
    InterviewDetailSkeletonComponent,
    FloatLabelModule,
    InputText,
    Tooltip,
    Message,
    ImageComponent,
    ImageSkeletonComponent,
    BadgeModule,
    ChipModule,
    TagModule,
    DividerModule,
  ],
  templateUrl: './interview-detail.component.html',
  styleUrl: './interview-detail.component.scss',
})
export class InterviewDetailComponent extends BaseComponent implements OnInit {
  public name = 'test';
  public previousRounds: RoundsAccordion[] = [];
  public text!: string;
  public score = new Score();
  public configMap!: ConfigMap;
  public fGroup!: FormGroup;
  public scorevalue!: number;
  public isLoading = true;
  public isFeedbackCriteriaLoaded = false;
  public isInterviewerLoaded = false;
  public feedbackCriteriaError: string | null = null;
  public interviewerError: string | null = null;
  public requestData!: CandidateDetailRequest;
  public feedbackRequest!: InterviewerFeedback;
  public assessmentId!: string | null;
  public interviewId!: string | null;
  public candidateid!: string | null;
  public assessmentRoundId!: string | null;
  public interviewerId!: string;
  public interview!: Interview;
  public hasfile = false;
  public isSubmitted = false;
  public responseData!: InterviewerCandidate;
  public totalFeedbackScore: number = 0;
  public candidateStatus: string | null = null;
  public isCheckingCandidateStatus = false;
  public uploadedFileName: string | undefined;
  public feedbackdetails!: Feedbackcriteria[];
  public feedbackcriteria: AccordionData[] = [];
  public uploadedFile: FileDto[] = [];
  public pendingFiles: File[] = [];
  public pendingFilePreviews: string[] = [];
  @ViewChild('fileUpload') fileUpload: any;
  private ref: DynamicDialogRef | undefined;
  public previewImageUrls: string[] = [];
  public isImageLoading = false;
  public forceCancelRequest: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public files: any[] = [];
  constructor(
    private interviewService: InterviewService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private storeService: StoreService,
    public dialog: DialogService,
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

  public GetfeedbackCriteria() {
    const next = (res: Feedbackcriteria[]) => {
      this.feedbackdetails = res;
      this.feedbackCriteriaError = null;
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
      this.uploadedFile = [];
      this.previewImageUrls = [];
      this.pendingFiles = [];
      this.pendingFilePreviews = [];

      this.feedbackcriteria.forEach((feedback) => {
        if (feedback.fileDto && feedback.fileDto.length > 0) {
          feedback.fileDto.forEach((file) => {
            this.isImageLoading = true;
            this.uploadedFile.push(file);
            this.previewImage(file);
          });
        }
      });
      this.isFeedbackCriteriaLoaded = true;
      this.checkAllApisLoaded();
    };
    const error = (error: CustomErrorResponse) => {
      this.feedbackCriteriaError = error.error?.type || 'Failed to load feedback criteria';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
      this.isFeedbackCriteriaLoaded = true;
      this.checkAllApisLoaded();
    };
    this.interviewService
      .GetFeedbackCriteria(Number(this.interviewId), this.interviewerId)
      .subscribe({ next, error });
  }

  public async onsave(feedback: AccordionData): Promise<void> {
    this.isLoading = true;

    if (feedback.title === 'Attachments' && this.pendingFiles.length > 0) {
      try {
        const uploadedFiles = await this.uploadPendingFiles();
        this.uploadedFile = [...this.uploadedFile, ...uploadedFiles];
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to upload some files',
        });
        this.isLoading = false;
        return;
      }
    }

    this.feedbackRequest = {
      assessmentId: Number(this.assessmentId),
      candidateId: this.candidateid ?? '',
      feedbackCriteriaId: feedback.title === 'Attachments' ? 6 : feedback.value,
      interviewerId: this.interviewerId ?? '',
      feedbackDetails: feedback.content ?? '',
      feedbackScore: feedback.score ?? 0,
      assessmentRoundId: Number(this.assessmentRoundId),
      interviewId: Number(this.interviewId),
      fileDto:
        feedback.title === 'Attachments' && this.uploadedFile.length
          ? this.uploadedFile
          : [],
    };
    this.calculateTotalFeedbackScore();
    if (this.feedbackRequest.fileDto != null && this.feedbackRequest.fileDto.length > 0) {
      this.isImageLoading = true;
      this.previewImageUrls = [];
      this.feedbackRequest.fileDto.forEach((file) => {
        this.previewImage(file);
      });
    }
    const next = (res: InterviewerFeedback) => {
      this.messageService.add({
        severity: 'Success',
        summary: 'Success',
        detail: 'Feedback Saved Successfully',
      });
      this.isLoading = false;
      feedback.isSaved = true;
      feedback.id = res.id ? res.id : 0;
      if (feedback.fileDto) {
        feedback.fileDto = [...this.uploadedFile];
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
    const next = () => {
      if (feedback.fileDto && feedback.fileDto.length > 0) {
        this.isImageLoading = true;
        this.GetfeedbackCriteria();
      }
      this.messageService.add({
        severity: 'Success',
        summary: 'Success',
        detail: 'Feedback Updated Successfully',
      });
      this.isLoading = false;
      feedback.isSaved = true;
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

  public onScoreChange() {
    const newScore = this.fGroup.get('score')?.value;
    this.scorevalue = newScore;
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
        severity: 'Success',
        summary: 'success',
        detail: 'Submitted Successfully',
      });
      this.isSubmitted = res.statusId == 7 ? true : false;
      this.getAssessmentDetails(this.requestData);
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
  public validateScore(feedback: AccordionData) {
    feedback.isScoreInValid =
      feedback.score != null &&
      feedback.maxScore != null &&
      feedback.score > feedback.maxScore;
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
              pendingFile.lastModified === file.lastModified
          );
          
          if (!isDuplicate) {
            newFiles.push(file);
            this.pendingFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e: any) => {
              if (!this.pendingFilePreviews.includes(e.target.result)) {
                this.pendingFilePreviews.push(e.target.result);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      });

      setTimeout(() => {
        if (this.fileUpload && this.fileUpload.clear) {
          this.fileUpload.clear();
        }
      }, 100);
    }
  }

  public removePendingFile(index: number): void {
    this.pendingFiles.splice(index, 1);
    this.pendingFilePreviews.splice(index, 1);
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
              this.pendingFiles = [];
              this.pendingFilePreviews = [];
              resolve(uploadedFiles);
            }
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    });
  }

  public removeImage(index: number) {
    this.previewImageUrls.splice(index, 1);
    this.uploadedFile.splice(index, 1);
  }
  public previewImage(file: FileDto): void {
    this.interviewService
      .GetFiles({
        blobId: file.blobId || file.id,
        attachmentType: file.attachmentType,
      })
      .subscribe({
        next: (blob: Blob) => {
          this.isImageLoading = false;
          const imageUrl = URL.createObjectURL(blob);
          this.previewImageUrls.push(imageUrl);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load the image',
          });
        },
      });
  }
  public formatSize(bytes: number): string {
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public onSelectedFiles(event: any): void {
    this.files = event.currentFiles;
  }

  private getAssessmentDetails(payload: CandidateDetailRequest): void {
    const next = (res: InterviewerCandidate) => {
      this.responseData = res;
      this.interviewerError = null;
      this.isSubmitted = res.statusId == 7 ? true : false;
      this.isInterviewerLoaded = true;
      this.checkAllApisLoaded();
      // Fetch candidate status from assessment round after getting interview details
      this.fetchCandidateStatusFromAssessmentRound();
    };
    const error = (error?: CustomErrorResponse) => {
      this.interviewerError = error?.error?.type || 'Failed to load interviewer data';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No data Found',
      });
      this.isInterviewerLoaded = true;
      this.checkAllApisLoaded();
    };
    this.interviewService
      .GetCandidateDetails(payload)
      .subscribe({ next, error });
  }

  /**
   * Fetches the candidate's status from the assessment round table
   */
  private fetchCandidateStatusFromAssessmentRound(): void {
    if (!this.assessmentRoundId || !this.candidateid || !this.assessmentId) {
      return;
    }

    this.isCheckingCandidateStatus = true;
    const filterMap: FilterMap = {
      assessmentRoundId: Number(this.assessmentRoundId),
      assessmentId: Number(this.assessmentId),
    };

    const payload = {
      multiSortedColumns: [],
      filterMap: filterMap,
      pagination: {
        pageNumber: 1,
        pageSize: 100, // Get enough records to find the candidate
      },
    };

    this.interviewService
      .paginationEntity<CandidateData>('InterviewSummary', payload)
      .subscribe({
        next: (res: PaginatedData<CandidateData>) => {
          this.isCheckingCandidateStatus = false;
          // Find the candidate by email (candidateId)
          const candidate = res.data.find(
            (item: CandidateData) => item.email === this.candidateid,
          );
          if (candidate) {
            this.candidateStatus = candidate.status || null;
          } else {
            this.candidateStatus = null;
          }
        },
        error: () => {
          this.isCheckingCandidateStatus = false;
          this.candidateStatus = null;
        },
      });
  }

  private checkAllApisLoaded(): void {
    if (this.isFeedbackCriteriaLoaded && this.isInterviewerLoaded) {
      this.isLoading = false;
    }
  }
  private setConfigMaps(): void {
    const { metadata } = new Score();
    this.configMap = metadata.configMap || {};
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
  private subcribeToInterviewerId(): void {
    const sub = this.storeService.state$.subscribe((value) => {
      this.interviewerId = value.userState.id;
    });
    this.subscriptionList.push(sub);
  }

  private calculateTotalFeedbackScore(): void {
    this.totalFeedbackScore = this.feedbackcriteria
      .map((fb) => Number(fb.score) || 0) // Ensure numeric addition
      .reduce((acc, curr) => acc + curr, 0);
  }

  /**
   * Checks if the candidate's status in the assessment round table is "Completed"
   */
  public isCandidateStatusCompleted(): boolean {
    return this.candidateStatus?.toLowerCase() === 'completed';
  }

  /**
   * Handles Select Candidate action
   */
  public onSelectCandidate(): void {
    // Check if candidate status in assessment round table is "Completed"
    if (!this.isCandidateStatusCompleted()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Candidate status must be "Completed" in the assessment round table before selecting the candidate.',
      });
      return;
    }

    const modalData: DialogData = {
      message: `Are you sure you want to select this candidate?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Select',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Selection',
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

    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.updateCandidateStatus(8, 'selected');
      }
    });
  }

  /**
   * Handles Reject Candidate action
   */
  public onRejectCandidate(): void {
    // Check if candidate status in assessment round table is "Completed"
    if (!this.isCandidateStatusCompleted()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Candidate status must be "Completed" in the assessment round table before rejecting the candidate.',
      });
      return;
    }

    const modalData: DialogData = {
      message: `Are you sure you want to reject this candidate?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Reject',
    };

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Confirm Rejection',
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

    this.ref.onClose.subscribe((result) => {
      if (result) {
        this.updateCandidateStatus(9, 'rejected');
      }
    });
  }

  /**
   * Updates the candidate status
   * @param statusId - 8 for Selected, 9 for Rejected
   * @param actionName - 'selected' or 'rejected' for success messages
   */
  private updateCandidateStatus(statusId: number, actionName: string): void {
    if (!this.responseData || !this.assessmentRoundId || !this.assessmentId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Missing required data to update candidate status.',
      });
      return;
    }

    const payload: CandidatePayload[] = [
      {
        candidateId: this.responseData.candidateId,
        assessmentRoundId: Number(this.assessmentRoundId),
        isActive: true,
        statusId: statusId,
        assessmentId: Number(this.assessmentId),
      },
    ];

    this.isLoading = true;

    const next = () => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail:
          actionName === 'selected'
            ? 'Candidate selected successfully'
            : 'Candidate rejected successfully',
      });
      // Refresh the candidate details and status to reflect the updated status
      this.getAssessmentDetails(this.requestData);
      // Refresh candidate status from assessment round table
      setTimeout(() => {
        this.fetchCandidateStatusFromAssessmentRound();
      }, 500);
    };

    const error = (error?: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          actionName === 'selected'
            ? 'Failed to select candidate. Please try again.'
            : 'Failed to reject candidate. Please try again.',
      });
    };

    this.interviewService
      .updateEntity('InterviewStatus', payload)
      .subscribe({ next, error });
  }
}
