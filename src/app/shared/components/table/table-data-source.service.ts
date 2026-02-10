/* eslint-disable @typescript-eslint/no-explicit-any */
// table-data-source.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, switchMap, finalize } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { PaginatedPayload } from '../../models/pagination.models';
import { PaginatedData } from '../../models/table.models';

@Injectable()
export class TableDataSourceService<T> {
  private endpointUrl!: string;
  private readonly payloadSubject = new BehaviorSubject<PaginatedPayload>(
    new PaginatedPayload(),
  );
  private readonly externalFilterSubject = new BehaviorSubject<Record<string, any>>({});
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  public data$: Observable<PaginatedData<T>>;
  public loading$ = this.loadingSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.data$ = combineLatest([
      this.payloadSubject.asObservable(),
      this.externalFilterSubject,
    ]).pipe(
      switchMap(([payload, externalFilters]) => {
        this.loadingSubject.next(true);
        const mergedPayload = { ...payload };
        mergedPayload.filterMap = {
          ...payload.filterMap,
          ...externalFilters,
        };

        return this.http
          .post<PaginatedData<T>>(this.endpointUrl, mergedPayload)
          .pipe(finalize(() => this.loadingSubject.next(false)));
      }),
    );
  }

  setEndpoint(url: string) {
    this.endpointUrl = url;
  }

  getData(payload: PaginatedPayload): Observable<PaginatedData<T>> {
    if (!this.endpointUrl) {
      throw new Error('Endpoint URL not set in TableDataSourceService.');
    }
    this.loadingSubject.next(true);
    return this.http
      .post<PaginatedData<T>>(this.endpointUrl, payload)
      .pipe(finalize(() => this.loadingSubject.next(false)));
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
