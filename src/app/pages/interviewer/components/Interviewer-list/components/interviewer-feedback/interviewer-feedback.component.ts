import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { EditorModule } from 'primeng/editor';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { FloatLabel } from 'primeng/floatlabel';
import { Knob } from 'primeng/knob';
import { Message } from 'primeng/message';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { ImageComponent } from '../../../../../../shared/components/image/image.component';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { InterviewService } from '../../../../../admin/components/assessment/services/interview.service';
import { Score } from '../../../../../admin/models/assessment.model';
import {
  AccordionData,
  CandidateDetailRequest,
  Feedbackcriteria,
  FileDto,
  FileRequest,
  Interview,
  InterviewerCandidate,
  InterviewerFeedback,
} from '../../../../../admin/models/interviewer.model';
import { InterviewerFeedbackSkeletonComponent } from './interviewer-feedback.skeleton';

@Component({
  selector: 'app-interviewer-feedback',
  imports: [
    Knob,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    Toast,
    FileUploadModule,
    ImageComponent,
    FloatLabel,
    Tooltip,
    Message,
    ButtonComponent,
    EditorModule,
    InterviewerFeedbackSkeletonComponent,
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
  public isLoading = true;
  public isSubmitted = false;
  public responseData!: InterviewerCandidate;
  public feedbackRequest!: InterviewerFeedback;
  public isImageLoading = false;
  public interview!: Interview;
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
      this.isLoading = false;
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
            this.previewImage(file);
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

      this.isLoading = false;
    };
    this.interviewService
      .GetFeedbackCriteria(Number(this.interviewId), this.interviewerId)
      .subscribe({ next, error });
  }
  private calculateTotalFeedbackScore(): void {
    this.totalFeedbackScore = this.feedbackcriteria
      .map((fb) => Number(fb.score) || 0) // Ensure numeric addition
      .reduce((acc, curr) => acc + curr, 0);
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
      this.isLoading = false;

      this.isSubmitted = res.statusId == 7 ? true : false;
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
      .GetCandidateDetails(payload)
      .subscribe({ next, error });
  }
  public onFileChange(event: FileSelectEvent): void {
    const files = event.currentFiles;
    if (files.length) {
      if (!this.feedbackRequest) {
        this.feedbackRequest = {
          assessmentId: Number(this.assessmentId),
          candidateId: this.candidateid ?? '',
          feedbackCriteriaId: 6, // Attachments
          interviewerId: this.interviewerId ?? '',
          feedbackDetails: '',
          feedbackScore: 0,
          assessmentRoundId: Number(this.assessmentRoundId),
          interviewId: Number(this.interviewId),
          fileDto: [],
        };
      }

      files.forEach((file) => {
        const payload: FileRequest = {
          attachmentType: 9,
          file: file,
        };

        this.interviewService.uploadFiles(payload).subscribe({
          next: (uploadedFile: FileDto) => {
            this.uploadedFile.push(uploadedFile);
            this.feedbackRequest.fileDto?.push(uploadedFile);
          },
        });
      });
    }
  }
  public removeImage(index: number) {
    this.previewImageUrls.splice(index, 1);
    this.uploadedFile.splice(index, 1);
  }
  public validateScore(feedback: AccordionData) {
    feedback.isScoreInValid =
      feedback.score != null &&
      feedback.maxScore != null &&
      feedback.score > feedback.maxScore;
  }
  public onsave(feedback: AccordionData): void {
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
        feedback.title === 'Attachments' && this.uploadedFile.length
          ? this.uploadedFile
          : [],
    };
    this.calculateTotalFeedbackScore();
    if (this.feedbackRequest.fileDto != null) {
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
      this.messageService.add({
        severity: 'Success',
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
}
