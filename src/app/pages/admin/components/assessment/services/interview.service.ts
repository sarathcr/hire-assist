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

  public GetFiles(payload: FileDto): Observable<Blob> {
    const url = `${this.getResourceUrl()}/files?blobId=${payload.blobId}&attachmentId=${payload.attachmentType}`;
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

  public deleteFiles(payload: FileDto) {
    return this.httpClient.delete(
      `${this.getResourceUrl()}/files?blobId=${payload.blobId}&attachmentTypeId=${payload.attachmentType}`,
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
}
