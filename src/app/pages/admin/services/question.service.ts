import { Injectable } from '@angular/core';
import { Questionsinterface } from '../models/question.model';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../shared/services/store.service';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { Observable } from 'rxjs';

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
  public updateQuestion(payload: Questionsinterface) {
    return this.httpClient.put(`${this.getResourceUrl()}/Question`, payload);
  }
}
