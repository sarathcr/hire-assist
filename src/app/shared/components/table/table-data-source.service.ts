/* eslint-disable @typescript-eslint/no-explicit-any */
// table-data-source.service.ts
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  skip,
  switchMap,
} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../models/pagination.models';

@Injectable()
export class TableDataSourceService<T> {
  private endpointUrl!: string;
  private payloadSubject = new BehaviorSubject<PaginatedPayload>(
    new PaginatedPayload(),
  );
  private externalFilterSubject = new BehaviorSubject<Record<string, any>>({});

  public data$: Observable<PaginatedData<T>>;

  constructor(private http: HttpClient) {
    this.data$ = combineLatest([
      this.payloadSubject.asObservable().pipe(skip(1)),
      this.externalFilterSubject,
    ]).pipe(
      switchMap(([payload, externalFilters]) => {
        const mergedPayload = { ...payload };
        mergedPayload.filterMap = {
          ...payload.filterMap,
          ...externalFilters,
        };

        return this.http.post<PaginatedData<T>>(
          this.endpointUrl,
          mergedPayload,
        );
      }),
    );
  }

  setEndpoint(url: string) {
    this.endpointUrl = url;
  }

  getData(payload: PaginatedPayload): Observable<T[]> {
    if (!this.endpointUrl) {
      throw new Error('Endpoint URL not set in TableDataSourceService.');
    }
    return this.http.post<T[]>(this.endpointUrl, payload);
  }

  updatePayload(payload: PaginatedPayload) {
    this.payloadSubject.next(payload);
  }

  setExternalFilters(filters: Record<string, any>) {
    this.externalFilterSubject.next(filters);
  }

  refresh() {
    this.payloadSubject.next({ ...this.payloadSubject.value });
  }
}
