import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { QuestionType } from '../models/question-type.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QuestionTypeService extends ApiService<any> {
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

  public addQuestionType(payload: QuestionType): Observable<any> {
    return this.httpClient.post(`${this.getResourceUrl()}/QuestionType`, payload);
  }

  public updateQuestionType(payload: QuestionType): Observable<any> {
    return this.httpClient.put(`${this.getResourceUrl()}/QuestionType`, payload);
  }

  public deleteQuestionType(id: number): Observable<any> {
    return this.httpClient.delete(`${this.getResourceUrl()}/QuestionType/${id}`);
  }

  public getQuestionTypeById(id: number): Observable<any> {
    return this.httpClient.get(`${this.getResourceUrl()}/QuestionType/${id}`);
  }
}
