/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  Input,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterMatchMode, MessageService, SelectItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule, TableRowCollapseEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Tooltip } from 'primeng/tooltip';
import { debounceTime, Subject } from 'rxjs';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../models/pagination.models';
import {
  PaginatedDataActions,
  TableColumnsData,
} from '../../models/table.models';
import { BaseComponent } from '../base/base.component';
import { ImageComponent } from '../image';
import { ImageSkeletonComponent } from '../image/image-skeleton';

export const matchOptions = [
  { label: 'Equals', value: FilterMatchMode.EQUALS },
  { label: 'Not Equals', value: FilterMatchMode.NOT_EQUALS },
];

export const uniqueStatuses = [
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Selected', value: 'Selected' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Rejected', value: 'Rejected' },
];

export const uniqueStatusesForIsSchedule = [
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'NotScheduled', value: 'Not scheduled' },
];
export const uniquesActives = [
  { label: 'Active', value: 'Active' },
  { label: 'InActive', value: 'InActive' },
];

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    TableModule,
    SelectModule,
    ToastModule,
    ToolbarModule,
    TextareaModule,
    CommonModule,
    DropdownModule,
    InputTextModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    InputText,
    ChipModule,
    PaginatorModule,
    SkeletonModule,
    TagModule,
    BadgeModule,
    Tooltip,
    DatePipe,
    ImageComponent,
    ImageSkeletonComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent<
  T extends { id: string; [key: string]: any },
> extends BaseComponent {
  public searchValue!: string;
  private readonly searchSubject = new Subject<PaginatedPayload>();
  @Input() previewImageUrls: Record<number, string[]> = {};
  @Input() isImageLoadings: Record<number, boolean> = {};
  @ViewChild('dt') table!: Table;
  @Input() hasCheckbox = true;
  // Track first lazy load event
  public isFirstLazyLoad = true;

  // Input Properties
  public tableData = input<PaginatedData<T>>();
  public columnsData = input<TableColumnsData>();
  public exportButton = input<boolean>(false);
  public hasView = input<boolean>(false);
  public hasRowEdit = input<boolean>(true);
  public alreadySelected = input<string[]>([]);
  public selectedItems: { id: string }[] = [];
  public expandedRows: Record<string, boolean> = {};
  public matchModeOptions: SelectItem[] = matchOptions;
  public activeStatusOptions: SelectItem[] = uniquesActives;
  public statusOptions: SelectItem[] = uniqueStatuses;
  public statusOptionsForSchedule: SelectItem[] = uniqueStatusesForIsSchedule;
  public hasSearch = input<boolean>(false);
  public activeFilters = new Set<string>();
  public isAnyFilterActive = false;

  public parentLoader = input<boolean>(false);
  private readonly internalIsLoading = signal<boolean>(false);
  public isLoading = computed(
    () => this.parentLoader() || this.internalIsLoading(),
  );

  // Output Properties
  public edit = output<any>();
  public view = output<any>();
  public btnClick = output<any>();
  public delete = output<any>();
  public selectedIds = output<any>();
  public select = output<string[]>();
  public reject = output<string[]>();
  public import = output<File>();
  public pageChangeAndSort = output<PaginatedPayload>();
  public buttonClick = output<any>();
  public PaginatedDataActions: any = PaginatedDataActions;

  constructor(private readonly messagesService: MessageService) {
    super();
    effect(() => {
      if (this.tableData()) {
        this.internalIsLoading.set(false);
      }
      const ids = this.alreadySelected();
      const data = this.tableData()?.data || [];
      this.selectedItems = data.filter((item) =>
        ids.includes(item?.id?.toString()),
      );
    });

    const sub = this.searchSubject
      .pipe(debounceTime(400))
      .subscribe((payload: PaginatedPayload) => {
        this.pageChangeAndSort.emit(payload);
      });
    this.subscriptionList.push(sub);
  }

  public displayData = computed(() => {
    if (this.isLoading()) {
      return [];
    }
    return this.tableData()?.data || [];
  });

  public onEdit(data: any): void {
    this.edit.emit(data);
  }
  public onSearch(event: any): void {
    this.internalIsLoading.set(true);
    this.isAnyFilterActive = true;
    this.searchValue = event.target.value ?? '';
    const payload: PaginatedPayload = new PaginatedPayload();
    payload.filterMap['searchKey'] = this.searchValue;
    this.searchSubject.next(payload);
    if (this.searchValue === '') {
      this.isAnyFilterActive = false;
    }
  }

  public onDelete(id: string): void {
    this.delete.emit(id);
  }

  public onButtonClick(event: any, fName?: string): void {
    this.buttonClick.emit({ event, fName });
  }

  public onView(data: any): void {
    this.view.emit(data);
  }
  public onStartInterview(data: any): void {
    this.btnClick.emit(data);
  }

  public onImport(event: any): void {
    const file = event.files[0];
    this.import.emit(file);
  }

  public oncheckBoxClicked(): void {
    this.selectedIds.emit(this.selectedItems);
    if (this.selectedItems.length == 0) {
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected items.',
      });
    }
  }

  public onRowExpand(id: string): void {
    const item = this.tableData()?.data.find((item) => item.id === id) as T & {
      isExpanded?: boolean;
    };
    if (item) {
      item.isExpanded = !item.isExpanded;
    }
  }

  public onRowCollapse(event: TableRowCollapseEvent): void {
    this.messagesService.add({
      severity: 'success',
      summary: 'Row Collapsed',
      detail: event.data.name,
      life: 3000,
    });
  }
  public getSeverity(
    status: string,
  ):
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'contrast'
    | undefined {
    switch (status?.toLowerCase()) {
      case 'inactive':
        return 'danger';
      case 'completed':
        return 'success';
      case 'pending':
        return 'warn';
      case 'negotiation':
        return 'warn';
      case 'scheduled':
        return 'success';
      case 'active':
        return 'success';
      case 'selected':
        return 'info';
      case 'rejected':
        return 'danger';
      case 'assigned':
        return 'success';
      default:
        return 'info';
    }
  }

  public onClear() {
    this.internalIsLoading.set(true);
    this.searchValue = '';
    this.activeFilters.clear();
    this.isAnyFilterActive = false;
    this.table.clear();
    const payload: PaginatedPayload = new PaginatedPayload();
    this.pageChangeAndSort.emit(payload);
  }

  public onLazyLoad(event: any): void {
    if (this.isFirstLazyLoad) {
      this.isFirstLazyLoad = false;
      return;
    }
    this.internalIsLoading.set(true);
    this.activeFilters.clear();
    const payload: PaginatedPayload = new PaginatedPayload();
    payload.pagination.pageNumber = (event.first ?? 0) / (event.rows ?? 1) + 1;
    payload.pagination.pageSize =
      event.rows ?? this.tableData()?.pageSize ?? 10;

    // Sorting
    if (event.multiSortMeta) {
      payload.multiSortedColumns = event.multiSortMeta.map((sort: any) => ({
        active: sort.field,
        direction: sort.order === 1 ? 'asc' : 'desc',
      }));
    } else if (event.sortField) {
      payload.multiSortedColumns.push({
        active: event.sortField,
        direction: event.sortOrder === 1 ? 'asc' : 'desc',
      });
    }

    // Filtering
    if (event.filters) {
      Object.entries(event.filters).forEach(([field, filterMeta]) => {
        const constraints = filterMeta as {
          value: any;
          matchMode: string;
          operator?: string;
        }[];

        if (Array.isArray(constraints) && constraints.length > 0) {
          const validConstraints = constraints.filter(
            (c) => c.value !== null && c.value !== undefined,
          );

          if (validConstraints.length > 0) {
            this.activeFilters.add(field);
            const filterString = validConstraints
              .map((constraint, index) => {
                const operator =
                  constraint.operator?.toUpperCase() === 'OR' ? 'OR' : 'AND';
                const condition = this.mapMatchModeToOperator(
                  constraint.matchMode,
                  constraint.value,
                );
                return index === 0 ? condition : `${operator} ${condition}`;
              })
              .join(' ');

            payload.filterMap[field] = filterString;
          }
        }
      });
    }
    if (this.searchValue) {
      payload.filterMap['searchKey'] = this.searchValue;
    }

    this.isAnyFilterActive = this.activeFilters.size > 0 || !!this.searchValue;
    // Emit the combined filter/sort/page info
    this.pageChangeAndSort.emit(payload);
  }

  public getRowsPerPageOptions(): number[] {
    const total = this.tableData()?.totalRecords ?? 0;
    const step = 5;
    const options: number[] = [];

    for (let i = step; i <= total; i += step) {
      options.push(i);
    }

    if (total % step !== 0) {
      const nextStep = Math.ceil(total / step) * step;
      if (!options.includes(nextStep)) {
        options.push(nextStep);
      }
    }

    return options;
  }

  public collapseAll(): void {
    this.expandedRows = {};
  }

  // Private methods

  public getMatchModes(column: any): SelectItem[] | undefined {
    if (column.hasMultiStatus) {
      return undefined;
    } else {
      return this.matchModeOptions;
    }
  }

  private mapMatchModeToOperator(matchMode: string, value: any): string {
    switch (matchMode) {
      case 'contains':
        return `like %${value}%`;
      case 'notContains':
        return `not like %${value}%`;
      case 'startsWith':
        return `like ${value}%`;
      case 'endsWith':
        return `like %${value}`;
      case 'equals':
        return `= ${value}`;
      case 'notEquals':
        return `!= ${value}`;
      case 'lt':
        return `< ${value}`;
      case 'lte':
        return `<= ${value}`;
      case 'gt':
        return `> ${value}`;
      case 'gte':
        return `>= ${value}`;
      case 'dateIs':
        return `= ${value}`;
      case 'dateIsNot':
        return `!= ${value}`;
      case 'dateBefore':
        return `< ${value}`;
      case 'dateAfter':
        return `> ${value}`;
      default:
        return `= ${value}`;
    }
  }
}
