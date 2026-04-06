import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { INTERVIEW_URL } from '../../../../../shared/constants/api';
import { ApiService } from '../../../../../shared/services/api.service';
import { StoreService } from '../../../../../shared/services/store.service';
import {
  InterviewPanels,
  InterviewPanelsResponse,
} from '../../../../coordinator/models/interview-panels.model';
import { PanelSummary } from '../../../models/assessment-schedule.model';
import { candidatePreviousAssessments } from '../../../models/candidate-data.model';
import {
  CandidateDetailRequest,
  Feedbackcriteria,
  FileDto,
  FileRequest,
  Interview,
  InterviewerCandidate,
  InterviewerFeedback,
  InterviewerRefreshRequest,
} from '../../../models/interviewer.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InterviewService extends ApiService<any> {
  constructor(
    private readonly httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  public getResourceUrl(): string {
    return INTERVIEW_URL;
  }

  public DeleteCandidate(id: string) {
    return this.httpClient.delete<string>(`${INTERVIEW_URL}/${id}`);
  }
  public GetCandidateDetails(payload: CandidateDetailRequest) {
    return this.httpClient.post<InterviewerCandidate>(
      `${this.getResourceUrl()}/Interviewer`,
      payload,
    );
  }
  public PostFeedback(payload: InterviewerFeedback) {
    return this.httpClient.post<InterviewerFeedback>(
      `${this.getResourceUrl()}/Feedback`,
      payload,
    );
  }

  public updateFeedback(payload: InterviewerFeedback) {
    return this.httpClient.put<InterviewerFeedback>(
      `${this.getResourceUrl()}/Feedback`,
      payload,
    );
  }
  public GetFeedbackCriteria(interviewId: number, InterviewerId: string) {
    return this.httpClient.get<Feedbackcriteria[]>(
      `${this.getResourceUrl()}/FeedbackCriteria?interviewId=${interviewId}&interviewerId=${InterviewerId}`,
    );
  }

  public GetFeedback(id: number): Observable<InterviewerFeedback> {
    return this.httpClient.get<InterviewerFeedback>(
      `${this.getResourceUrl()}/Feedback/${id}`,
    );
  }
  public UpdateInterview(interviewId: number, payload: Interview) {
    return this.httpClient.put<Interview>(
      `${this.getResourceUrl()}?Id=${interviewId}`,
      payload,
    );
  }
  public getPanel(assessmentId: number) {
    return this.httpClient.get<PanelSummary>(
      `${this.getResourceUrl()}/InterviewPanel/assessmentId?assessmentId=${assessmentId}`,
    );
  }
  public addinterviewpanel(payload: InterviewPanels) {
    return this.httpClient.post<InterviewPanels>(
      `${this.getResourceUrl()}/InterviewPanel`,
      payload,
    );
  }

  public createInterviewPanels(payload: Array<{
    panelId: number | null;
    interviewers: string[];
    interviewId: number | null;
    assessmentId: number | null;
  }>) {
    // Backend expects wrapper object with interviewPanelDto field
    const wrappedPayload = {
      interviewPanelDto: payload,
    };
    return this.httpClient.post(
      `${this.getResourceUrl()}/InterviewPanel`,
      wrappedPayload,
    );
  }

  public GetFiles(payload: FileDto): Observable<Blob> {
    let blobId = payload.blobId || payload.id || '';
    // Append file extension from name if blobId doesn't already have one
    if (payload.name && !blobId.includes('.')) {
      const extMatch = payload.name.match(/\.[^.]+$/);
      if (extMatch) {
        blobId += extMatch[0];
      }
    }
    const url = `${this.getResourceUrl()}/files?blobId=${blobId}&attachmentId=${payload.attachmentType}`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  public uploadFiles(payload: FileRequest) {
    const formData = new FormData();
    formData.append('Type', payload.attachmentType.toString());
    formData.append('File', payload.file);

    return this.httpClient.post<FileDto>(
      `${this.getResourceUrl()}/files`,
      formData,
    );
  }

  public uploadMultiFiles(payload: { attachmentType: number; files: File[] }) {
    const formData = new FormData();
    formData.append('Type', payload.attachmentType.toString());
    payload.files.forEach((file) => {
      formData.append('File', file);
    });

    return this.httpClient.post<FileDto[]>(
      `${this.getResourceUrl()}/files/multifiles`,
      formData,
    );
  }

  public uploadAttachment(payload: {
    idType: number;
    file: File;
    id: number;
    interviewerId: string;
    candidateId: string;
    assessmentId: number;
    feedbackCriteriaId: number;
    feedbackDetails: string;
    feedbackScore: number;
    assessmentRoundId: number;
    interviewId: number;
  }) {
    const formData = new FormData();
    formData.append('IdType', payload.idType.toString());
    formData.append('File', payload.file);
    formData.append('Id', payload.id.toString());
    formData.append('InterviewerId', payload.interviewerId);
    formData.append('CandidateId', payload.candidateId);
    formData.append('AssessmentId', payload.assessmentId.toString());
    formData.append('FeedbackCriteriaId', payload.feedbackCriteriaId.toString());
    formData.append('FeedbackDetails', payload.feedbackDetails);
    formData.append('FeedbackScore', payload.feedbackScore.toString());
    formData.append('AssessmentRoundId', payload.assessmentRoundId.toString());
    formData.append('InterviewId', payload.interviewId.toString());

    return this.httpClient.post<{ success: boolean; fileUrl: string; message: string }>(
      `${this.getResourceUrl()}/UploadAttachment`,
      formData,
    );
  }

  public deleteFiles(payload: FileDto) {
    const blobId = payload.blobId || payload.id;
    return this.httpClient.delete(
      `${this.getResourceUrl()}/DeleteAttachment?blobId=${blobId}&attachmentTypeId=${payload.attachmentType}`,
    );
  }
  public updateinterviewpanel(payload: InterviewPanelsResponse) {
    return this.httpClient.put<InterviewPanelsResponse>(
      `${this.getResourceUrl()}/InterviewPanel?interviewId=${payload.interviewId}`,
      payload,
    );
  }
  public GetCandidateAssessmentDetails(
    candidateId: string,
    assessmentId: number,
  ) {
    return this.httpClient.get<candidatePreviousAssessments[]>(
      `${this.getResourceUrl()}/Feedback/${candidateId}/${assessmentId}`,
    );
  }

  public createInterviewPanel(payload: {
    panelId: number | null;
    interviewers: string[];
    interviewId: number | null;
    assessmentId: number | null;
  }) {
    return this.httpClient.post(
      `${this.getResourceUrl()}/InterviewPanel`,
      payload,
    );
  }

  public InterviewerRefresh(payload: InterviewerRefreshRequest) {
    return this.httpClient.put(
      `${this.getResourceUrl()}/InterviewerRefresh`,
      payload,
    );
  }
}
