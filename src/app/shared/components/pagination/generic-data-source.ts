import { DataSource } from '@angular/cdk/collections';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, of, Subscription } from 'rxjs';
import { PaginatedData } from '../../models/pagination.models';
import { PaginatedDataPayload, PaginatedDataSource } from './pagination.model';
import { PaginatedService } from './pagination.service';

@Injectable()
export class GenericDataSource<T>
  implements DataSource<T>, PaginatedDataSource
{
  private subs: Subscription[] = [];
  private dataSubject = new BehaviorSubject<T[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private totalPages = new BehaviorSubject<number>(0);
  public totalRecords = new BehaviorSubject<number>(0);

  public loading$ = this.loadingSubject.asObservable();
  public totalPages$ = this.totalPages.asObservable();
  public totalRecords$ = this.totalRecords.asObservable();
  public baseUrl = '';
  public optionInitialPayload!: PaginatedDataPayload | object;

  constructor(private service: PaginatedService<T>) {}

  //   Public methods
  public init(baseURL: string) {
    this.service.init(baseURL);
    this.baseUrl = baseURL;
  }

  public connect(payload?: PaginatedDataPayload | object) {
    if (payload) {
      this.optionInitialPayload = payload;
    }

    return this.dataSubject.asObservable();
  }

  public disconnect(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
    this.dataSubject.complete();
    this.loadingSubject.complete();
  }

  public loadPaginatedData(payload: PaginatedDataPayload) {
    this.loadingSubject.next(true);
    payload = { ...payload, ...this.optionInitialPayload };
    this.service
      .getPaginatedData(this.baseUrl, payload)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe((paginatedData) => {
        this.updatePaginatedData(paginatedData);
      });
  }

  public getPayloadData(): PaginatedDataPayload {
    const payload: PaginatedDataPayload = {
      sortedColumn: { active: '', direction: '' },
      filterMap: {},
      pagination: { pageNumber: 0, pageSize: 10 },
    };

    return payload;
  }

  private updatePaginatedData(paginatedData: PaginatedData<T> | null) {
    const [totalPages, dataList, totalRecords] = paginatedData
      ? [
          paginatedData.totalPages,
          paginatedData.data,
          paginatedData.totalRecords,
        ]
      : [0, [], 0];
    this.totalPages.next(totalPages);
    this.totalRecords.next(totalRecords);
    this.dataSubject.next(dataList);
  }
}
