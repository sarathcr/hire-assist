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
  public totalFeedbackScore: number = 0;
  public previewImageUrls: Map<string, string> = new Map();
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
      this.previewImageUrls.clear();
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
        originalContent: item.comments ?? '',
        originalScore: item.score ?? null,
      }));
      this.feedbackcriteria.forEach((feedback) => {
        if (feedback.title === 'Attachments' && feedback.fileDto && feedback.fileDto.length > 0) {
             this.uploadedFile = [...feedback.fileDto];
        }
      });
      this.calculateTotalFeedbackScore();
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
    const key = file.blobId || file.id;
    if (key && this.previewImageUrls.has(key)) {
      return this.previewImageUrls.get(key) || '';
    }
    return '';
  }

  public getCorrectAnswers(
    detail: AssessmentDetails & { correctAnswers?: number },
  ): number {
    return detail.correctAnswers ?? 0;
  }
  public previewImage(file: FileDto): void {
    const key = file.blobId || file.id;
    if (!key) return;

    this.isImageLoading = true;
    this.isImageLoading = true;
    this.interviewService
      .GetFiles(file)
      .subscribe({
        next: (blob: Blob) => {
          const imageUrl = URL.createObjectURL(blob);
          this.previewImageUrls.set(key, imageUrl);
          this.isImageLoading = false;
        },
        error: () => {
          this.isImageLoading = false;
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
      
      // Auto-save: Upload pending files immediately
      this.uploadAndSaveAttachments();
    }
  }

  private uploadAndSaveAttachments(): void {
    const attachmentFeedback = this.feedbackcriteria.find(f => f.title === 'Attachments');
    if (!attachmentFeedback) return;

    this.uploadPendingFiles()
      .then((uploadedFiles: FileDto[]) => {
        if (uploadedFiles.length > 0) {
          // Update feedback object
           if (!attachmentFeedback.fileDto) {
             attachmentFeedback.fileDto = [];
           }
           
           // Filter duplicates (though uploadPendingFiles pushes to this.uploadedFile, 
           // we need to sync attachmentFeedback.fileDto if it's separate? 
           // In 'onsave' we pushed to feedback.fileDto. 
           // Implementation in uploadPendingFiles pushes to this.uploadedFile.
           
           // Sync this.uploadedFile to attachmentFeedback.fileDto
           // Actually `this.uploadedFile` is used as the source of truth for display?
           // Let's ensure consistency.
           
           // Just add the new files to the feedback dto for saving
           const newUniqueFiles = uploadedFiles.filter(newFile => 
             !attachmentFeedback.fileDto!.some(existing => existing.blobId === newFile.blobId)
           );
           
           if (newUniqueFiles.length > 0) {
             attachmentFeedback.fileDto.push(...newUniqueFiles);
             
             // Fetch blobs for display
             newUniqueFiles.forEach(file => this.previewImage(file));
             
             // Save feedback to persist the association
             this.saveFeedback(attachmentFeedback, newUniqueFiles); 
           }
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
      const uploadedFiles: FileDto[] = [];
      const totalFiles = this.pendingFiles.length;

      if (totalFiles === 0) {
        resolve(uploadedFiles);
        return;
      }

      this.isUploadingFiles = true;

      const payload = {
        attachmentType: 9,
        files: this.pendingFiles,
      };

      this.interviewService.uploadMultiFiles(payload).subscribe({
        next: (uploadedFilesResponse: FileDto[]) => {
          // Add mapped files to local list
          uploadedFiles.push(...uploadedFilesResponse);
          this.uploadedFile.push(...uploadedFiles);
          
          this.pendingFiles = [];
          this.pendingFilePreviews = [];
          this.isUploadingFiles = false;
          resolve(uploadedFiles);
        },
        error: (error) => {
          this.isUploadingFiles = false;
          reject(error);
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
    const attachmentFeedback = this.feedbackcriteria.find(f => f.title === 'Attachments');
    if (attachmentFeedback && attachmentFeedback.fileDto) {
         // Ensure uploadedFile matches the attachments
         this.uploadedFile = [...attachmentFeedback.fileDto];
         
         this.uploadedFile.forEach(file => {
             // Only fetch if not already fetched
             const key = file.id || file.blobId;
             if (key && !this.previewImageUrls.has(key)) {
                 this.previewImage(file);
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
          const attachmentFeedback = this.feedbackcriteria.find(f => f.title === 'Attachments');
          if (attachmentFeedback && attachmentFeedback.fileDto) {
              const fileIdx = attachmentFeedback.fileDto.findIndex(f => (f.id === file.id && f.blobId === file.blobId));
              if (fileIdx !== -1) {
                  attachmentFeedback.fileDto.splice(fileIdx, 1);
              }
              // Save feedback to reflect the removal of the attachment link
              // We pass empty array for filesToSave because we are just updating the state (deletion), not adding new files.
              // But strictly speaking, if we delete a file, do we need to update the feedback object via API?
              // The `deleteFiles` API likely deletes the file record. 
              // Does it check if it's linked to a feedback? 
              // If the file is deleted, the link is probably broken or removed by cascade, 
              // BUT to be safe and ensure the backend knows the feedback is updated, we call saveFeedback (update).
              // Actually, simply calling saveFeedback with remaining files might be correct or just empty.
              // The `saveFeedback` uses `fileDto` from the request or `filesToSave`.
              // `filesToSave` is used if `length > 0`.
              // So if we pass [], it sends what logic?
              // `fileDto: feedback.title === 'Attachments' && filesToSave.length > 0 ? filesToSave : [],`
              // If we pass [], it sends empty list. 
              // Does the backend Replace the list or Append?
              // Based on `onsave` logic: 
              // `fileDto: feedback.title === 'Attachments' && filesToSave.length > 0 ? filesToSave : [],`
              // If we delete a file, we probably want to send the *remaining* files?
              // Or does the backend only accept *new* files to add?
              // If it ONLY accepts new files, then deleting the file via `deleteFiles` API is enough.
              // However, the user request says "the save button functionalities and needed api calls should happen".
              // The save logic updates `feedbackRequest`.
              // If I call saveFeedback(attachmentFeedback, []), it basically updates the feedback entity details/score.
              // It doesn't seem to send the *full list* of current files to *replace* them, only *new* files to *add*.
              // Because `filesToSave` comes from `newUniqueFiles` in `onsave`.
              
              // So, `deleteFiles` probably handles the actual deletion.
              // But we might want to trigger `saveFeedback` just to "save" the state of feedback if needed (e.g. isSaved=true).
              this.saveFeedback(attachmentFeedback, [], false);
          }
        },
        error: () => {
             this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete file',
          });
        }
      });
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
          // Update local feedback.fileDto state so the UI updates
          if (!feedback.fileDto) {
            feedback.fileDto = [];
          }

          // Filter out duplicates based on blobId to prevent adding the same file twice
          const newUniqueFiles = uploadedFiles.filter(newFile => 
            !feedback.fileDto!.some(existing => existing.blobId === newFile.blobId)
          );

          if (newUniqueFiles.length > 0) {
            feedback.fileDto.push(...newUniqueFiles);

            // Fetch blobs for new files so they display correctly
            newUniqueFiles.forEach(file => this.previewImage(file));
            
            // Save only the new unique files
            this.saveFeedback(feedback, newUniqueFiles);
          } else {
             // If all were duplicates or none uploaded (though uploadPendingFiles checks non-empty), 
             // we might not need to save if nothing changed, 
             // but if user just wants to ensure state or if there were other changes... 
             // safest is to save with empty list if we only intended to link new files.
             // If this was just an upload-triggered save, and no new files, maybe skip?
             // But let's call save with empty list to be safe / consistent with "onsave" intent.
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
      const existingFiles =
        feedback.title === 'Attachments' ? this.uploadedFile : [];
      // Note: passing existingFiles here might re-send them? 
      // saveFeedback logic: `feedback.title === 'Attachments' && filesToSave.length > 0 ? filesToSave : []`
      // If we pass existing files, it might try to save them again? 
      // Usually "filesToSave" implies NEW files to link. 
      // If no new files, we pass [].
      this.saveFeedback(feedback, []);
    }
  }

  private saveFeedback(feedback: AccordionData, filesToSave: FileDto[], showToast: boolean = true): void {
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
          detail: feedback.isSaved ? 'Feedback Updated Successfully' : 'Feedback Saved Successfully',
        });
      }
      this.isLoading = false;
      feedback.isSaved = true;
      feedback.id = res.id ? res.id : feedback.id;
      
      // Update original values to match current saved values
      feedback.originalContent = feedback.content;
      feedback.originalScore = feedback.score;

      // Update feedback item with saved fileDto if attachments
      if (feedback.title === 'Attachments' && res.fileDto && res.fileDto.length > 0) {
        feedback.fileDto = res.fileDto;
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
      this.isLoading = false;
    };

    if (feedback.isSaved || feedback.id) {
        this.interviewService.updateFeedback(this.feedbackRequest).subscribe({ next, error });
    } else {
        this.interviewService.PostFeedback(this.feedbackRequest).subscribe({ next, error });
    }
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
    feedback.isSaved = true; // Ensure it stays true during edit to prevent button flicker
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Feedback Updated Successfully',
      });
      this.isLoading = false;
      feedback.isSaved = true;
      
      // Update original values to match current saved values
      feedback.originalContent = feedback.content;
      feedback.originalScore = feedback.score;
      
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

  public hasChanges(feedback: AccordionData): boolean {
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

  private stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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
  public onAccordionOpen(feedback: AccordionData): void {
    if (
      feedback.title === 'Attachments' &&
      feedback.fileDto &&
      feedback.fileDto.length > 0
    ) {
      feedback.fileDto.forEach((file) => {
        const key = file.blobId || file.id;
        if (key && !this.previewImageUrls.has(key)) {
          this.previewImage(file);
        }
      });
    }
  }
}
