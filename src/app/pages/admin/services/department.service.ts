import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { Department } from '../models/department.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DepartmentService extends ApiService<any> {
  constructor(
    private httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }
  //   override getResourceUrl(): string {
  //     return Department_URL;
  //   }
  override getResourceUrl(): string {
    return ASSESSMENT_URL;
  }

  public addDepartment(payload: Department) {
    return this.httpClient.post(`${this.getResourceUrl()}/Department`, payload);
  }
  public updateDepartment(payload: Department) {
    return this.httpClient.put(`${this.getResourceUrl()}/Department`, payload);
  }
  public deleteDepartment(id: number) {
    return this.httpClient.delete(`${this.getResourceUrl()}/Department/${id}`);
  }
}
