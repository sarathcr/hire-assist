import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { CANDIDATE_URL } from '../../../constants/api';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CandidateService extends ApiService<any> {
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }
  override getResourceUrl(): string {
    return CANDIDATE_URL;
  }

  // // DUMMY SERVICE
  // public
}
