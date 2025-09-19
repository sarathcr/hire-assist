import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import {
  Assessment,
  AssessmentRound,
  Batch,
  CoordinatorAssessmentRounds,
  CoordinatorDto,
  FileDto,
  IdProofRequest,
  IdProofUploadRequest,
} from '../models/assessment.model';
import {
  CandidateBatchCheckRequest,
  CandidateBatchCheckResponse,candidateDetails
} from '../models/candidate-data.model';
import {
  frontDeskInterface,
  frontDeskResponse,
} from '../models/frontDesk-model';
import {
  AssignToAnotherBatchRequest,
  GetSelectedQuestionsForSet,
  MarkAsPresentRequest,
} from '../models/question.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AssessmentService extends ApiService<any> {
  constructor(
    private readonly httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  override getResourceUrl(): string {
    return ASSESSMENT_URL;
  }
  public getAssessmentRoundByAssessmnetId(id: number) {
    return this.httpClient.get<AssessmentRound[]>(
      //`${this.getResourceUrl()}/api/assessment/candidate-questions`
      `${this.getResourceUrl()}/AssessmentRound/assessmentId?assessmentId=${id}`,
    );
  }

  public getQuestionsBySet(setId: string) {
    return this.httpClient.get<GetSelectedQuestionsForSet>(
      `${ASSESSMENT_URL}/questionsetquestions?questionSetId=${setId}`,
    );
  }

  public addFrontDeskUser(payload: frontDeskInterface[]) {
    return this.httpClient.post(`${this.getResourceUrl()}/frontDesk`, payload);
  }

  public getFrontDeskUser() {
    return this.httpClient.get(`${this.getResourceUrl()}/frontDesk`);
  }

  public getFrontDeskUserByAssessment(assessmentId: number) {
    return this.httpClient.get<frontDeskResponse[]>(
      `${this.getResourceUrl()}/frontDeskAssessment/${assessmentId}`,
    );
  }

  public deleteFrontDeskUsers(ids: number[]) {
    return this.httpClient.request(
      'delete',
      `${this.getResourceUrl()}/frontDesk`,
      {
        body: ids,
      },
    );
  }
  public GetIdProofById(payload: IdProofRequest): Observable<Blob> {
    const url = `${this.getResourceUrl()}/files?blobId=${payload.blobId}&attachmentId=${payload.attachmentTypeId}&candidateId=${payload.candidateId}`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  public getIdProofsByCandidateId(candidateId: string) {
    return this.httpClient.get<FileDto[]>(
      `${this.getResourceUrl()}/getById?candidateId=${candidateId}`,
    );
  }

  public uploadIdProof(payload: IdProofUploadRequest) {
    const formData = new FormData();
    formData.append('CandidateId', payload.CandidateId.toString());
    formData.append('IdType', payload.IdType.toString());
    formData.append('File', payload.File);

    return this.httpClient.post<FileDto>(
      `${this.getResourceUrl()}/Upload`,
      formData,
    );
  }

  public deleteIdProof(payload: IdProofRequest) {
    return this.httpClient.delete(
      `${this.getResourceUrl()}/Delete?blobId=${payload.blobId}&attachmentTypeId=${payload.attachmentTypeId}&candidateId=${payload.candidateId}`,
    );
  }

  public getAssessmentsForFrontDesk() {
    return this.httpClient.get<Assessment[]>(`${this.getResourceUrl()}/All`);
  }

  public getAssessmentRoundsForFrontDesk(id: number) {
    return this.httpClient.get<Assessment[]>(
      `${this.getResourceUrl()}/${id}/Rounds`,
    );
  }

  public getBatchesForFrontDesk(id: number) {
    return this.httpClient.get<Batch[]>(
      `${this.getResourceUrl()}/${id}/Batches`,
    );
  }

  public markasPresent(request: MarkAsPresentRequest) {
    return this.httpClient.put(`${this.getResourceUrl()}/Present`, request);
  }

  public assignToAnotherBatch(request: AssignToAnotherBatchRequest) {
    return this.httpClient.put(
      `${this.getResourceUrl()}/AssignToAnotherBatch`,
      request,
    );
  }

  public Getcoordinator(id: number) {
    return this.httpClient.get<CoordinatorDto>(
      `${this.getResourceUrl()}/Coordinator/${id}`,
    );
  }
  public Deletecoordinator(id: number) {
    return this.httpClient.delete<string>(
      `${this.getResourceUrl()}/Coordinator/${id}`,
    );
  }

  public getAssessmentRoundByAssessmentIdCoordinator(id: number) {
    return this.httpClient.get<CoordinatorAssessmentRounds[]>(
      `${this.getResourceUrl()}/AssessmentRoundCoordinator/${id}`,
    );
  }

  public checkAllCandidatesAssignedToBatches(
    payload: CandidateBatchCheckRequest,
  ) {
    return this.httpClient.post<CandidateBatchCheckResponse>(
      `${this.getResourceUrl()}/batch-assigned-status`,
      payload,
    );
  }

  public getCandidateDetails(candidateId: string, assessmentId: number) {
    return this.httpClient.get<candidateDetails>(
      `${this.getResourceUrl()}/candidates/${candidateId}/${assessmentId}`,
    );
  }
}
