import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { PaginatedData } from '../../models/pagination.models';
import { PaginatedDataPayload } from './pagination.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PaginatedService<T> {
  private baseURL = '';

  constructor(private http: HttpClient) {}

  public init(baseURL: string) {
    this.baseURL = baseURL;
  }

  public getPaginatedData(
    baseUrl: string,
    payload: PaginatedDataPayload,
  ): Observable<PaginatedData<T>> {
    // console.log('Final API Call:', baseUrl, payload); // Debug log

    return this.http.post<PaginatedData<T>>(baseUrl, payload).pipe(
      catchError((err) => {
        console.error('API Call Failed:', err);
        throw err;
      }),
    );
  }
}
