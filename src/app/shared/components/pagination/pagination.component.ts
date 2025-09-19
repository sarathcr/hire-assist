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

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [PaginatorModule],
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

  @Input() dataSource!: GenericDataSource<any>;

  @Output() filterChange = new EventEmitter<PaginatedDataPayload>();

  public filterState: KeyValueMap<string> = {};

  private dataList: any[] = [];
  private search = new Subject<void>();
  private search$ = this.search.asObservable().pipe(debounceTime(150));

  ngOnInit(): void {
    const sub = this.dataSource.connect().subscribe((dataList) => {
      this.dataList = dataList;
    });
    this.subscriptionList.push(sub);
    this.search$.subscribe(() => {
      this.loadDataSource(); // Debounced search
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['filterMap']) {
      const searchFilterMap = changes['filterMap']?.currentValue;
      this.onSearch(searchFilterMap);
    }

    if (changes && changes['forceUpdate']) {
      this.search.next();
    }
  }

  ngAfterViewInit() {
    // this.initSubscriptions();
    setTimeout(() => {
      this.loadDataSource();
    }, 150);
  }

  public onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.loadDataSource();
  }

  private loadDataSource() {
    const payload = this.getPayloadData();
    this.dataSource.loadPaginatedData(payload);
  }

  private getPayloadData(): PaginatedDataPayload {
    const pageNumber = Math.floor(this.first / this.rows) + 1;

    const filterPayload: PaginatedDataPayload = {
      sortedColumn: {
        direction: this.sortRef?.direction || '',
        active: this.sortRef?.active || '',
      },
      filterMap: this.filterState,
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
    this.filterState = { ...this.filterState, ...searchFilterMap };
    this.search.next();
  }
}
