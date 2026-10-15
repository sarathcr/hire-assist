/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { PaginatedDataPayload } from './pagination.model';
import { GenericDataSource } from './generic-data-source';
import { KeyValueMap } from '../../models/common.models';
import { BaseComponent } from '../base/base.component';
import { debounceTime, Subject } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import * as _ from 'lodash';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [PaginatorModule, SkeletonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent
  extends BaseComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() public first = 0;
  @Input() public rows = 10;
  @Input() public totalRecords = 0;
  @Input() filterMap: KeyValueMap<string> = {};
  @Input() public sortRef: { active: string; direction: 'asc' | 'desc' | '' } =
    { active: '', direction: '' };
  @Input() isLoading = false;
  @Input() dataSource!: GenericDataSource<any>;

  @Output() filterChange = new EventEmitter<PaginatedDataPayload>();

  public filterState: KeyValueMap<string> = {};

  private dataList: any[] = [];
  private search = new Subject<void>();
  private search$ = this.search.asObservable().pipe(debounceTime(150));
  private hasInitialLoad = false;
  private initialLoadTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const sub = this.dataSource.connect().subscribe((dataList) => {
      this.dataList = dataList;
    });
    this.subscriptionList.push(sub);
    this.search$.subscribe(() => {
      this.loadDataSource();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['filterMap']) {
      const curr = changes['filterMap'].currentValue || {};
      const prev = changes['filterMap'].previousValue;
      if (changes['filterMap'].firstChange) {
        this.filterState = { ...this.filterState, ...curr };
      } else if (!_.isEqual(prev, curr)) {
        this.filterState = {};
        this.onSearch(curr);
      }
    }

    if (changes && changes['sortRef']) {
      if (!changes['sortRef'].firstChange) {
        this.first = 0;
      }
    }

    if (changes && changes['forceUpdate']) {
      if (this.dataSource) {
        this.dataSource.lastPayload = null as any;
      }
      this.search.next();
    }
  }

  ngAfterViewInit() {
    if (this.dataSource?.lastPayload) {
      this.hasInitialLoad = true;
      return;
    }
    // Only load on initial view init, skip if already loaded
    if (!this.hasInitialLoad) {
      // Clear any existing timeout
      if (this.initialLoadTimeout) {
        clearTimeout(this.initialLoadTimeout);
      }
      this.initialLoadTimeout = setTimeout(() => {
        if (!this.hasInitialLoad) {
          this.loadDataSource();
          this.hasInitialLoad = true;
        }
        this.initialLoadTimeout = null;
      }, 150);
    }
  }

  public onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.loadDataSource();
  }

  private loadDataSource() {
    const payload = this.getPayloadData();
    if (_.isEqual(this.dataSource?.lastPayload, payload)) {
      return;
    }
    this.dataSource.loadPaginatedData(payload);
  }

  private getPayloadData(): PaginatedDataPayload {
    const pageNumber = Math.floor(this.first / this.rows) + 1;

    const baseFilter =
      this.filterMap && Object.keys(this.filterMap).length > 0
        ? this.filterMap
        : (this.dataSource?.lastPayload?.filterMap || {});

    const filterPayload: PaginatedDataPayload = {
      sortedColumn: {
        direction: this.sortRef?.direction || '',
        active: this.sortRef?.active || '',
      },
      filterMap: {
        ...baseFilter,
        ...(this.filterState || {}),
      },
      pagination: {
        pageNumber,
        pageSize: this.rows,
      },
    };

    this.filterChange.emit(filterPayload);
    return filterPayload;
  }

  public onSearch(searchFilterMap: KeyValueMap<string>) {
    if ((searchFilterMap as unknown as Event)?.type === 'change') return;
    const merged = { ...this.filterState, ...searchFilterMap };
    if (_.isEqual(this.filterState, merged)) return;
    this.filterState = merged;
    this.first = 0;
    this.search.next();
  }
}
