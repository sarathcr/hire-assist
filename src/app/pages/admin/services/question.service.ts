import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import {
  FileDto,
  FileRequest,
  Questionsinterface,
} from '../models/question.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QuestionService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  override getResourceUrl(): string {
    return ASSESSMENT_URL;
  }

  public addQuestion(payload: Questionsinterface) {
    return this.httpClient.post(`${this.getResourceUrl()}/Question`, payload);
  }
  public deleteQuestion(id: number) {
    return this.httpClient.delete(
      `${this.getResourceUrl()}/Question/${id}`,
      {},
    );
  }
  public getQuestion(id: number): Observable<Questionsinterface> {
    return this.httpClient.get<Questionsinterface>(
      `${this.getResourceUrl()}/Question/${id}`,
    );
  }

  public getBlobs(url: string): Observable<Blob> {
    return this.httpClient.get<Blob>(`${this.getResourceUrl()}/files/${url}`);
  }
  public updateQuestion(payload: Questionsinterface) {
    return this.httpClient.put(`${this.getResourceUrl()}/Question`, payload);
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

  public uploadMultiFiles(payload: FileRequest) {
    const formData = new FormData();

    formData.append('Type', payload.attachmentType.toString());
    if (payload.files) {
      for (const file of payload.files) {
        formData.append('Files', file);
      }
    }
    return this.httpClient.post<FileDto[]>(
      `${this.getResourceUrl()}/files/multifiles`,
      formData,
    );
  }
}
