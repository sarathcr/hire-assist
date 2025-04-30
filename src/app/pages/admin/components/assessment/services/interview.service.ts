import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { StoreService } from '../../../../../shared/services/store.service';
import { INTERVIEW_URL } from '../../../../../shared/constants/api';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class InterviewService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
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
}
