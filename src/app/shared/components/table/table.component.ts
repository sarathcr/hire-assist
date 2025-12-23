/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostBinding,
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
  { label: 'Inactive', value: 'Inactive' },
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
  @Input() onLoadQuestionImage?: (id: number) => void;
  @Input() onLoadOptionImage?: (id: number) => void;
  @ViewChild('dt') table!: Table;
  @Input() hasCheckbox = true;
  // Track first lazy load event
  public isFirstLazyLoad = true;
  // Track last pagination call to prevent duplicates
  private lastPaginationCall: {
    payload: PaginatedPayload;
    timestamp: number;
  } | null = null;
  private readonly PAGINATION_DEBOUNCE_MS = 100;
  // Flag to prevent emitting selectedIds when initializing from alreadySelected
  private isInitializingFromAlreadySelected = false;
  // Track last emitted selection to prevent duplicate emissions
  private lastEmittedSelection: string[] = [];
  // Track applied filters separately from typed filters
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  private appliedFilters: { [key: string]: any } = {};

  // Input Properties
  public tableData = input<PaginatedData<T>>();
  public columnsData = input<TableColumnsData>();
  public exportButton = input<boolean>(false);
  public hasView = input<boolean>(false);
  public hasRowEdit = input<boolean>(true);
  public alreadySelected = input<string[]>([]);
  // Allows parent to clear selection for specific ids after API success
  public clearSelectionIds = input<string[] | null>(null);
  public selectedItems: { id: string }[] = [];
  // Persist selection across pages using ids
  private readonly persistedSelectedIds = new Set<string>();
  public expandedRows: Record<string, boolean> = {};
  public matchModeOptions: SelectItem[] = matchOptions;
  public activeStatusOptions: SelectItem[] = uniquesActives;
  public statusOptions: SelectItem[] = uniqueStatuses;
  public statusOptionsForSchedule: SelectItem[] = uniqueStatusesForIsSchedule;
  public hasSearch = input<boolean>(false);
  public searchDebounceTime = input<number>(400);
  public enableCandidateStyling = input<boolean>(false); // Enable candidate-specific row styling and tooltips
  public activeFilters = new Set<string>();
  public isAnyFilterActive = false;
  public globalPayload = new PaginatedPayload();

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
      const currentTableData = this.tableData();
      const alreadySelectedIds = this.alreadySelected();

      if (currentTableData && this.table) {
        this.internalIsLoading.set(false);

        // Sync alreadySelected into persistedSelectedIds when table data loads
        // This handles the case where alreadySelected was set before table data loaded
        if (alreadySelectedIds && alreadySelectedIds.length > 0) {
          const needsSync = !alreadySelectedIds.every((id) =>
            this.persistedSelectedIds.has(id),
          );
          if (needsSync) {
            // Add any missing IDs from alreadySelected
            for (const id of alreadySelectedIds) {
              this.persistedSelectedIds.add(id);
            }
            // Update lastEmittedSelection to prevent unnecessary emissions
            this.lastEmittedSelection = [...alreadySelectedIds];
          }
        }

        // Resync current page visual selection from persisted ids
        const currentPageData = currentTableData.data || [];

        const newSelectedItems = currentPageData.filter((item) =>
          this.persistedSelectedIds.has(String(item.id)),
        );

        this.selectedItems = newSelectedItems;

        // Only emit if not initializing from alreadySelected and selection has changed
        if (!this.isInitializingFromAlreadySelected) {
          const currentSelection = Array.from(this.persistedSelectedIds).sort(
            (a, b) => a.localeCompare(b),
          );
          const lastSelection = [...this.lastEmittedSelection].sort((a, b) =>
            a.localeCompare(b),
          );

          // Only emit if selection actually changed
          if (
            currentSelection.length !== lastSelection.length ||
            !currentSelection.every((id, index) => id === lastSelection[index])
          ) {
            this.lastEmittedSelection = [...currentSelection];
            // Emit persisted selection so parent controls reflect cross-page selection
            const selectedAcrossPagesOnData = currentSelection.map((id) => ({
              id,
            }));
            this.selectedIds.emit(selectedAcrossPagesOnData);
          }
        }
      }
    });

    const sub = this.searchSubject
      .pipe(debounceTime(this.searchDebounceTime()))
      .subscribe((payload: PaginatedPayload) => {
        this.pageChangeAndSort.emit(payload);
      });
    this.subscriptionList.push(sub);

    // Effect to initialize persistedSelectedIds from alreadySelected input
    effect(() => {
      const alreadySelectedIds = this.alreadySelected();
      const currentTableData = this.tableData();

      if (alreadySelectedIds && alreadySelectedIds.length > 0) {
        // Set flag to prevent emitting during initialization
        this.isInitializingFromAlreadySelected = true;

        // Check if we need to update (avoid unnecessary updates)
        const currentIds = Array.from(this.persistedSelectedIds).sort((a, b) =>
          a.localeCompare(b),
        );
        const newIds = [...alreadySelectedIds].sort((a, b) =>
          a.localeCompare(b),
        );
        const needsUpdate =
          currentIds.length !== newIds.length ||
          !currentIds.every((id, index) => id === newIds[index]);

        if (needsUpdate) {
          // Clear existing selection and set new ones
          this.persistedSelectedIds.clear();
          for (const id of alreadySelectedIds) {
            this.persistedSelectedIds.add(id);
          }
          // Update lastEmittedSelection to match, so we don't emit unnecessarily
          this.lastEmittedSelection = [...alreadySelectedIds];
        }

        // Update current page selection if table data is available
        if (currentTableData?.data) {
          this.selectedItems = currentTableData.data.filter((item) =>
            this.persistedSelectedIds.has(String(item.id)),
          );
        }

        // Reset flag after a microtask to allow change detection to complete
        setTimeout(() => {
          this.isInitializingFromAlreadySelected = false;
        }, 0);
      } else if (alreadySelectedIds && alreadySelectedIds.length === 0) {
        // If alreadySelected is explicitly empty, clear selection
        this.isInitializingFromAlreadySelected = true;
        this.persistedSelectedIds.clear();
        this.selectedItems = [];
        this.lastEmittedSelection = [];
        setTimeout(() => {
          this.isInitializingFromAlreadySelected = false;
        }, 0);
      }
    });

    // Effect to clear selection for provided ids from parent (e.g., after delete)
    effect(() => {
      const idsToClear = this.clearSelectionIds();
      if (idsToClear && idsToClear.length > 0) {
        for (const id of idsToClear) {
          this.persistedSelectedIds.delete(id);
        }
        // Recompute page selection
        const pageData = this.tableData()?.data || [];

        this.selectedItems = pageData.filter((item) =>
          this.persistedSelectedIds.has(String(item.id)),
        );

        // Emit updated cross-page selection
        const selectedAcrossPages = Array.from(this.persistedSelectedIds).map(
          (id) => ({ id }),
        );
        this.lastEmittedSelection = Array.from(this.persistedSelectedIds);
        this.selectedIds.emit(selectedAcrossPages);
      }
    });
  }

  public displayData = computed(() => {
    if (this.isLoading()) {
      return [];
    }
    return this.tableData()?.data || [];
  });

  public firstIndex = computed(() => {
    const currentTableData = this.tableData();
    if (!currentTableData) {
      return 0;
    }
    return (currentTableData.pageNumber - 1) * currentTableData.pageSize;
  });

  public onEdit(data: any): void {
    this.edit.emit(data);
  }

  public onSearch(event: any): void {
    this.internalIsLoading.set(true);
    this.searchValue = event.target.value ?? '';
    const payload: PaginatedPayload = { ...this.globalPayload };

    if (this.searchValue) {
      this.isAnyFilterActive = true;
      payload.filterMap['searchKey'] = this.searchValue;
    } else {
      delete payload.filterMap['searchKey'];

      this.isAnyFilterActive = this.activeFilters.size > 0;
    }

    this.searchSubject.next(payload);
  }

  public onDelete(id: string): void {
    // Optimistically prune selection for this id so header buttons update
    this.persistedSelectedIds.delete(id);

    this.selectedItems = (this.tableData()?.data || []).filter((item) =>
      this.persistedSelectedIds.has(String(item.id)),
    );

    const selectedAcrossPages = Array.from(this.persistedSelectedIds).map(
      (sid) => ({ id: sid }),
    );
    this.selectedIds.emit(selectedAcrossPages);
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

  // Keep persistedSelectedIds in sync with UI selection changes (row or header)
  public onSelectionChange(newSelection: { id: string }[]): void {
    const currentPageIds = (this.tableData()?.data || []).map((d) =>
      String(d.id),
    );

    // Remove any current page ids first (we will re-add based on newSelection)
    for (const id of currentPageIds) {
      this.persistedSelectedIds.delete(id);
    }

    // Add selected ids from current page
    for (const item of newSelection || []) {
      if (item?.id) {
        this.persistedSelectedIds.add(String(item.id));
      }
    }

    // Update selectedItems to reflect persisted set on current page
    this.selectedItems = (this.tableData()?.data || []).filter((item) =>
      this.persistedSelectedIds.has(String(item.id)),
    );

    // Emit full selection ids (persisted across pages) - user interaction, always emit
    const selectedAcrossPages = Array.from(this.persistedSelectedIds).map(
      (id) => ({ id }),
    );
    this.lastEmittedSelection = Array.from(this.persistedSelectedIds);
    this.selectedIds.emit(selectedAcrossPages);
  }

  // Public helper for parent via ViewChild to clear all selections (e.g., after bulk delete)
  public clearAllSelections(): void {
    this.persistedSelectedIds.clear();
    this.selectedItems = [];
    this.selectedIds.emit([]);
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
    this.appliedFilters = {};
    this.isAnyFilterActive = false;
    this.table.clear();
    const payload: PaginatedPayload = new PaginatedPayload();
    this.pageChangeAndSort.emit(payload);
  }
  // Inside your component's @Component decorator or class body
  @HostBinding('class.table-loading') get loadingClass() {
    return this.isLoading();
  }

  // Capture filters when user clicks Apply button
  public onFilterApplied(event: any): void {
    this.appliedFilters = JSON.parse(JSON.stringify(event.filters || {}));

    // Process the filters immediately
    this.processLazyLoad(event, true);
  }

  public onLazyLoad(event: any): void {
    // Skip first lazy load to prevent duplicate with initial ngOnInit call
    if (this.isFirstLazyLoad) {
      this.isFirstLazyLoad = false;
      return;
    }

    this.processLazyLoad(event, false);
  }

  private processLazyLoad(event: any, isFilterApply: boolean): void {
    // Prevent calls if already loading (from parent or internal) - except when applying filters
    if (!isFilterApply && this.isLoading()) {
      return;
    }

    this.internalIsLoading.set(true);
    this.activeFilters.clear();
    const payload: PaginatedPayload = new PaginatedPayload();
    payload.pagination.pageNumber = (event.first ?? 0) / (event.rows ?? 1) + 1;
    payload.pagination.pageSize =
      event.rows ?? this.tableData()?.pageSize ?? 10;

    // Prevent duplicate calls within debounce window - except when applying filters
    const now = Date.now();
    if (!isFilterApply && this.lastPaginationCall) {
      const timeSinceLastCall = now - this.lastPaginationCall.timestamp;
      const isSamePayload = this.isSamePayload(
        payload,
        this.lastPaginationCall.payload,
      );

      if (timeSinceLastCall < this.PAGINATION_DEBOUNCE_MS && isSamePayload) {
        this.internalIsLoading.set(false);
        return;
      }
    }

    // Update last call tracking
    this.lastPaginationCall = {
      payload: { ...payload },
      timestamp: now,
    };

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
    if (this.appliedFilters && Object.keys(this.appliedFilters).length > 0) {
      Object.entries(this.appliedFilters).forEach(([field, filterMeta]) => {
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
    this.globalPayload = payload;
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

  private isSamePayload(
    payload1: PaginatedPayload,
    payload2: PaginatedPayload,
  ): boolean {
    return (
      payload1.pagination.pageNumber === payload2.pagination.pageNumber &&
      payload1.pagination.pageSize === payload2.pagination.pageSize &&
      JSON.stringify(payload1.filterMap) ===
        JSON.stringify(payload2.filterMap) &&
      JSON.stringify(payload1.multiSortedColumns) ===
        JSON.stringify(payload2.multiSortedColumns)
    );
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
