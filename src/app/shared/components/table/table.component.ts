/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostBinding,
  Inject,
  Input,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterMatchMode, SelectItem } from 'primeng/api';
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
import { Table, TableModule } from 'primeng/table';
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
  public isFirstLazyLoad = true;
  private lastPaginationCall: {
    payload: PaginatedPayload;
    timestamp: number;
  } | null = null;
  private readonly filterApplicationTimestamp = signal<number | null>(null);
  private isInitializingFromAlreadySelected = false;
  private lastEmittedSelection: string[] = [];
  private appliedFilters: Record<string, any> = {};
  private isManualFilterTrigger = false;
  private isApplyingFilter = false;
  public tableData = input<PaginatedData<T>>();
  public columnsData = input<TableColumnsData>();
  public exportButton = input<boolean>(false);
  public hasView = input<boolean>(false);
  public hasRowEdit = input<boolean>(true);
  public alreadySelected = input<string[]>([]);
  public clearSelectionIds = input<string[] | null>(null);
  public selectedItems: { id: string }[] = [];
  private readonly persistedSelectedIds = new Set<string>();
  public expandedRows: Record<string, boolean> = {};
  public matchModeOptions: SelectItem[] = matchOptions;
  public activeStatusOptions: SelectItem[] = uniquesActives;
  public statusOptions: SelectItem[] = uniqueStatuses;
  public statusOptionsForSchedule: SelectItem[] = uniqueStatusesForIsSchedule;
  public hasSearch = input<boolean>(false);
  public searchDebounceTime = input<number>(400);
  public enableCandidateStyling = input<boolean>(false);
  public activeFilters = new Set<string>();
  public isAnyFilterActive = false;
  public globalPayload = new PaginatedPayload();

  public parentLoader = input<boolean>(false);
  private readonly internalIsLoading = signal<boolean>(false);
  public isLoading = computed(
    () => this.parentLoader() || this.internalIsLoading(),
  );
  public edit = output<any>();
  public view = output<any>();
  public btnClick = output<any>();
  public delete = output<any>();
  public unlock = output<any>();
  public selectedIds = output<any>();
  public select = output<string[]>();
  public reject = output<string[]>();
  public import = output<File>();
  public pageChangeAndSort = output<PaginatedPayload>();
  public buttonClick = output<any>();
  public PaginatedDataActions: any = PaginatedDataActions;

  public tooltipEvent = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      // Check if device supports touch - most reliable method
      const isTouchDevice =
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0 ||
        'ontouchstart' in (globalThis as any);
      // PrimeNG Tooltip supports: 'hover' | 'focus' | 'both'
      // Use 'both' to support both hover (desktop) and focus (mobile via click handler)
      return isTouchDevice ? 'both' : 'hover';
    }
    return 'hover';
  });

  public isTouchDevice = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      return (
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0 ||
        'ontouchstart' in (globalThis as any)
      );
    }
    return false;
  });

  private currentTooltipElement: HTMLElement | null = null;
  private tooltipTimeout: any = null;
  private clickTimeout: any = null;
  private lastClickTime = 0;

  public onRowClick(): void {
    // Only handle clicks on mobile devices
    // On desktop, we use PrimeNG's hover tooltip only
    // This function is kept for template compatibility but doesn't need parameters
    // as mobile uses touchend and desktop uses hover tooltip
  }

  private touchMoved = false;
  private touchStartX = 0;
  private touchStartY = 0;

  public onTouchStart(event: TouchEvent): void {
    // Reset touch moved flag and track position when touch starts
    if (this.isTouchDevice() && this.enableCandidateStyling()) {
      this.touchMoved = false;
      if (event.touches && event.touches.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
      }
    }
  }

  public onTouchMove(event: TouchEvent): void {
    // Mark that touch moved (user is scrolling)
    if (this.isTouchDevice() && this.enableCandidateStyling()) {
      if (event.touches && event.touches.length > 0) {
        const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);

        // If moved more than 10px, consider it a scroll
        if (deltaX > 10 || deltaY > 10) {
          this.touchMoved = true;
          // Cancel any pending tooltip
          if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
          }
          // Also hide any visible tooltip
          this.hideCustomTooltip();
        }
      }
    }
  }

  public onTouchEnd(event: TouchEvent, rowElement: HTMLElement, product: any): void {
    // On touch end, show tooltip directly if it was a tap (not scroll)
    if (this.isTouchDevice() && this.enableCandidateStyling()) {
      const target = event.target as HTMLElement;

      // Don't trigger if clicking on interactive elements (buttons, checkboxes, etc.)
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('p-button') ||
        target.closest('p-tableCheckbox')
      ) {
        return;
      }

      // If touch moved, don't show tooltip
      if (this.touchMoved) {
        this.touchMoved = false;
        return;
      }

      // Check final position to ensure it was a tap
      if (event.changedTouches && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);

        // Only show if it was a tap (small movement) - increased threshold
        if (deltaX < 15 && deltaY < 15) {
          // Get tooltip text
          const tooltipText = this.getTooltipText(product);
          if (!tooltipText) {
            return;
          }

          // Prevent default only when we're showing tooltip (to avoid click event)
          event.preventDefault();
          event.stopPropagation();

          // Hide any existing tooltip
          this.hideCustomTooltip();

          // Show custom tooltip immediately
          this.showCustomTooltip(rowElement, tooltipText);
        }
      }
    }
  }

  private getTooltipText(product: any): string {
    if (!this.enableCandidateStyling()) {
      return '';
    }

    if (product.isAlreadyExist) {
      return 'We already have this record in our records.';
    }
    if (product.isDuplicate) {
      return 'Duplicate records were discovered in the sheet.';
    }
    if (product.batchId && product.batchId > 0) {
      return `Scheduled - Assigned to : ${product.batchName || 'Batch ' + product.batchId}`;
    }
    if (
      !product.isAlreadyExist &&
      !product.isDuplicate &&
      (!product.batchId || product.batchId === 0 || product.batchId === null)
    ) {
      return 'Not scheduled - Candidate has not been scheduled for assessment';
    }
    return '';
  }

  private showCustomTooltip(targetElement: HTMLElement, text: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Hide any existing tooltip first
    this.hideCustomTooltip();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.setAttribute('id', 'table-custom-tooltip');
    tooltip.className = 'p-tooltip p-component p-tooltip-bottom';
    tooltip.style.cssText = `
      position: fixed !important;
      z-index: 999999 !important;
      max-width: 300px;
      min-width: 150px;
      word-wrap: break-word;
      pointer-events: none;
      opacity: 1 !important;
      display: block !important;
      visibility: visible !important;
    `;

    const arrow = document.createElement('div');
    arrow.className = 'p-tooltip-arrow';
    arrow.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid #ffffff;
      margin-bottom: -1px;
    `;

    const textDiv = document.createElement('div');
    textDiv.className = 'p-tooltip-text';
    textDiv.textContent = text;
    textDiv.style.cssText = `
      background-color: #ffffff !important;
      color: #000000 !important;
      font-size: 12px !important;
      padding: 8px 12px !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2) !important;
      white-space: normal !important;
      line-height: 1.4 !important;
      display: block !important;
      visibility: visible !important;
    `;

    tooltip.appendChild(arrow);
    tooltip.appendChild(textDiv);
    document.body.appendChild(tooltip);
    this.currentTooltipElement = tooltip;

    // Position tooltip immediately
    requestAnimationFrame(() => {
      this.positionTooltip(tooltip, targetElement);
    });

    // Auto-hide after 3 seconds
    this.tooltipTimeout = setTimeout(() => {
      this.hideCustomTooltip();
    }, 3000);

    // Hide on click outside or scroll
    const hideHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!tooltip.contains(target) && !targetElement.contains(target)) {
        this.hideCustomTooltip();
        document.removeEventListener('click', hideHandler, true);
        document.removeEventListener('touchstart', hideHandler, true);
        window.removeEventListener('scroll', hideHandler, true);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', hideHandler, true);
      document.addEventListener('touchstart', hideHandler, true);
      window.addEventListener('scroll', hideHandler, true);
    }, 100);
  }

  private positionTooltip(tooltip: HTMLElement, targetElement: HTMLElement): void {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;

    // Position below the row (bottom) by default
    let top = rect.bottom + scrollTop + 8; // 8px gap
    let left = rect.left + scrollLeft + rect.width / 2 - tooltipRect.width / 2;
    let showAbove = false;

    // Check if tooltip would go off bottom
    if (rect.bottom + tooltipRect.height + 8 > viewportHeight + scrollTop - padding) {
      showAbove = true;
      top = rect.top + scrollTop - tooltipRect.height - 8;
    }

    // Ensure tooltip stays within viewport horizontally
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));

    // Update arrow position if showing above
    const arrow = tooltip.querySelector('.p-tooltip-arrow') as HTMLElement;
    if (arrow && showAbove) {
      arrow.style.bottom = 'auto';
      arrow.style.top = '100%';
      arrow.style.borderBottom = 'none';
      arrow.style.borderTop = '8px solid #ffffff';
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  private hideCustomTooltip(): void {
    if (this.currentTooltipElement) {
      this.currentTooltipElement.remove();
      this.currentTooltipElement = null;
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    // Clean up custom tooltip on component destroy
    this.hideCustomTooltip();
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
  }

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    super();
    effect(() => {
      const currentTableData = this.tableData();
      const alreadySelectedIds = this.alreadySelected();

      if (!currentTableData || !this.table) {
        return;
      }

      // Check if external data reset happened (mismatch between last request and current data)
      if (this.lastPaginationCall) {
        const lastPageSize =
          this.lastPaginationCall.payload.pagination.pageSize;
        const lastPageNumber =
          this.lastPaginationCall.payload.pagination.pageNumber;

        if (
          currentTableData.pageSize !== lastPageSize ||
          currentTableData.pageNumber !== lastPageNumber
        ) {
          // External change detected, clear lastPaginationCall so next user action isn't blocked
          this.lastPaginationCall = null;
        }
      }

      const wasLoading = this.internalIsLoading();
      this.internalIsLoading.set(false);

      if (
        wasLoading &&
        this.hasAppliedFilters() &&
        this.lastPaginationCall &&
        !this.hasFiltersInPayload(this.lastPaginationCall.payload)
      ) {
        this.triggerFilterApplication();
        return;
      }

      this.handleSelectionSync(alreadySelectedIds, currentTableData);
    });

    const sub = this.searchSubject
      .pipe(debounceTime(this.searchDebounceTime()))
      .subscribe((payload: PaginatedPayload) => {
        this.pageChangeAndSort.emit(payload);
      });
    this.subscriptionList.push(sub);

    effect(() => {
      const alreadySelectedIds = this.alreadySelected();
      const currentTableData = this.tableData();

      if (alreadySelectedIds && alreadySelectedIds.length > 0) {
        this.isInitializingFromAlreadySelected = true;

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
          this.persistedSelectedIds.clear();
          for (const id of alreadySelectedIds) {
            this.persistedSelectedIds.add(id);
          }
          this.lastEmittedSelection = [...alreadySelectedIds];
        }

        this.selectedItems =
          currentTableData?.data?.filter((item) =>
            this.persistedSelectedIds.has(String(item.id)),
          ) || [];

        setTimeout(() => {
          this.isInitializingFromAlreadySelected = false;
        }, 0);
      } else if (alreadySelectedIds?.length === 0) {
        this.isInitializingFromAlreadySelected = true;
        this.persistedSelectedIds.clear();
        this.selectedItems = [];
        this.lastEmittedSelection = [];
        setTimeout(() => {
          this.isInitializingFromAlreadySelected = false;
        }, 0);
      }
    });

    effect(() => {
      const idsToClear = this.clearSelectionIds();
      if (idsToClear && idsToClear.length > 0) {
        for (const id of idsToClear) {
          this.persistedSelectedIds.delete(id);
        }
        const pageData = this.tableData()?.data || [];

        this.selectedItems = pageData.filter((item) =>
          this.persistedSelectedIds.has(String(item.id)),
        );

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
    const target = event.target as HTMLInputElement;
    if (target && (target as any).__isRestoring) {
      this.searchValue = event.target.value ?? '';
      return;
    }

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
  public onUnlock(data: any): void {
    this.unlock.emit(data);
  }
  public onStartInterview(data: any): void {
    this.btnClick.emit(data);
  }

  public onImport(event: any): void {
    const file = event.files[0];
    this.import.emit(file);
  }

  public onSelectionChange(newSelection: { id: string }[]): void {
    const currentPageIds = (this.tableData()?.data || []).map((d) =>
      String(d.id),
    );

    for (const id of currentPageIds) {
      this.persistedSelectedIds.delete(id);
    }

    for (const item of newSelection || []) {
      if (item?.id) {
        this.persistedSelectedIds.add(String(item.id));
      }
    }

    this.selectedItems = (this.tableData()?.data || []).filter((item) =>
      this.persistedSelectedIds.has(String(item.id)),
    );

    const selectedAcrossPages = Array.from(this.persistedSelectedIds).map(
      (id) => ({ id }),
    );
    this.lastEmittedSelection = Array.from(this.persistedSelectedIds);
    this.selectedIds.emit(selectedAcrossPages);
  }

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

  public onRowCollapse(): void {
    // Intentionally no toast here; collapsing rows is a common interaction and
    // we avoid requiring a DI dependency (MessageService) in this shared component.
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
  @HostBinding('class.table-loading') get loadingClass() {
    return this.isLoading();
  }

  public onFilterApplied(event: any): void {
    if (!event.filters || !this.table) {
      return;
    }

    const eventFilters = structuredClone(event.filters || {});

    if (!this.hasValidFilters(eventFilters)) {
      if (Object.keys(this.appliedFilters).length > 0) {
        this.appliedFilters = {};
        this.triggerFilterApplication();
      }
      return;
    }

    const previousAppliedFilters = structuredClone(this.appliedFilters);
    const filtersChanged =
      JSON.stringify(eventFilters) !== JSON.stringify(previousAppliedFilters);

    if (filtersChanged) {
      this.isApplyingFilter = true;
      this.appliedFilters = structuredClone(eventFilters);
      this.filterApplicationTimestamp.set(Date.now());

      const lazyLoadEvent = this.createLazyLoadEvent();
      this.isManualFilterTrigger = true;
      try {
        this.processLazyLoad(lazyLoadEvent);
      } finally {
        this.isManualFilterTrigger = false;
        this.isApplyingFilter = false;
      }
    }
  }

  public onLazyLoad(event: any): void {
    if (this.isFirstLazyLoad) {
      this.isFirstLazyLoad = false;
      return;
    }

    this.processLazyLoad(event);
  }

  private processLazyLoad(event: any): void {
    if (this.isLoading() && !this.isManualFilterTrigger) {
      return;
    }

    if (this.shouldSkipCall(event)) {
      this.internalIsLoading.set(false);
      return;
    }

    this.internalIsLoading.set(true);
    this.activeFilters.clear();

    const payload = this.buildPayload(event);

    if (this.shouldSkipDuplicateCall(payload)) {
      this.internalIsLoading.set(false);
      return;
    }

    this.lastPaginationCall = {
      payload: structuredClone(payload),
      timestamp: Date.now(),
    };

    this.globalPayload = payload;
    this.isAnyFilterActive = this.activeFilters.size > 0 || !!this.searchValue;
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

  private hasValidFilters(filters: Record<string, any>): boolean {
    return Object.keys(filters).some((field) => {
      const filterMeta = filters[field];
      if (Array.isArray(filterMeta) && filterMeta.length > 0) {
        return filterMeta.some(
          (c: any) =>
            c.value !== null && c.value !== undefined && c.value !== '',
        );
      }
      return false;
    });
  }

  private hasAppliedFilters(): boolean {
    return this.appliedFilters && Object.keys(this.appliedFilters).length > 0;
  }

  private hasFiltersInPayload(payload: PaginatedPayload): boolean {
    return payload.filterMap && Object.keys(payload.filterMap).length > 0;
  }

  private createLazyLoadEvent(): any {
    return {
      first: this.table.first || 0,
      rows: this.table.rows || this.tableData()?.pageSize || 10,
      sortField: this.table.sortField,
      sortOrder: this.table.sortOrder,
      multiSortMeta: this.table.multiSortMeta,
      filters: this.appliedFilters,
    };
  }

  private triggerFilterApplication(): void {
    const lazyLoadEvent = this.createLazyLoadEvent();
    this.isManualFilterTrigger = true;
    try {
      this.processLazyLoad(lazyLoadEvent);
    } finally {
      this.isManualFilterTrigger = false;
    }
  }

  private shouldSkipCall(event: any): boolean {
    if (this.isApplyingFilter && !this.isManualFilterTrigger) {
      return !!(event.multiSortMeta || event.sortField);
    }
    return false;
  }

  private buildPayload(event: any): PaginatedPayload {
    const payload = new PaginatedPayload();
    payload.pagination.pageNumber = (event.first ?? 0) / (event.rows ?? 1) + 1;
    payload.pagination.pageSize =
      event.rows ?? this.tableData()?.pageSize ?? 10;

    payload.multiSortedColumns = [];

    if (
      event.multiSortMeta &&
      Array.isArray(event.multiSortMeta) &&
      event.multiSortMeta.length > 0
    ) {
      payload.multiSortedColumns = event.multiSortMeta
        .filter(
          (sort: any) =>
            sort.field &&
            sort.order !== 0 &&
            sort.order !== null &&
            sort.order !== undefined,
        )
        .map((sort: any) => ({
          active: sort.field,
          direction: sort.order === 1 ? 'asc' : 'desc',
        }));
    } else if (event.sortField) {
      const sortOrder = event.sortOrder;
      if (
        sortOrder !== 0 &&
        sortOrder !== null &&
        sortOrder !== undefined &&
        sortOrder !== ''
      ) {
        let direction: 'asc' | 'desc' | '' = '';
        if (sortOrder === 1 || sortOrder === '1') {
          direction = 'asc';
        } else if (sortOrder === -1 || sortOrder === '-1') {
          direction = 'desc';
        }

        if (direction) {
          payload.multiSortedColumns.push({
            active: event.sortField,
            direction,
          });
        }
      }
    }

    if (this.hasAppliedFilters()) {
      Object.entries(this.appliedFilters).forEach(([field, filterMeta]) => {
        const constraints = filterMeta as {
          value: any;
          matchMode: string;
          operator?: string;
        }[];

        if (Array.isArray(constraints) && constraints.length > 0) {
          const validConstraints = constraints.filter(
            (c) => c.value !== null && c.value !== undefined && c.value !== '',
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

    return payload;
  }

  private shouldSkipDuplicateCall(payload: PaginatedPayload): boolean {
    if (!this.lastPaginationCall || this.isManualFilterTrigger) {
      return false;
    }

    const lastPayload = this.lastPaginationCall.payload;
    const sameSort =
      JSON.stringify(lastPayload.multiSortedColumns || []) ===
      JSON.stringify(payload.multiSortedColumns || []);
    const samePagination =
      lastPayload.pagination.pageNumber === payload.pagination.pageNumber &&
      lastPayload.pagination.pageSize === payload.pagination.pageSize;
    const lastHadFilters = this.hasFiltersInPayload(lastPayload);
    const currentHasFilters = this.hasFiltersInPayload(payload);

    if (
      sameSort &&
      samePagination &&
      !currentHasFilters &&
      !lastHadFilters &&
      this.hasAppliedFilters()
    ) {
      return true;
    }

    if (sameSort && samePagination && !lastHadFilters && currentHasFilters) {
      return this.isLoading();
    }

    if (sameSort && samePagination && lastHadFilters === currentHasFilters) {
      return (
        JSON.stringify(lastPayload.filterMap || {}) ===
        JSON.stringify(payload.filterMap || {})
      );
    }

    return false;
  }

  private handleSelectionSync(
    alreadySelectedIds: string[] | undefined,
    currentTableData: PaginatedData<T>,
  ): void {
    if (alreadySelectedIds && alreadySelectedIds.length > 0) {
      const needsSync = !alreadySelectedIds.every((id) =>
        this.persistedSelectedIds.has(id),
      );
      if (needsSync) {
        for (const id of alreadySelectedIds) {
          this.persistedSelectedIds.add(id);
        }
        this.lastEmittedSelection = [...alreadySelectedIds];
      }
    }

    const currentPageData = currentTableData.data || [];
    const newSelectedItems = currentPageData.filter((item) =>
      this.persistedSelectedIds.has(String(item.id)),
    );

    this.selectedItems = newSelectedItems;

    if (!this.isInitializingFromAlreadySelected) {
      this.emitSelectionIfChanged();
    }
  }

  private emitSelectionIfChanged(): void {
    const currentSelection = Array.from(this.persistedSelectedIds).sort(
      (a, b) => a.localeCompare(b),
    );
    const lastSelection = [...this.lastEmittedSelection].sort((a, b) =>
      a.localeCompare(b),
    );

    if (
      currentSelection.length !== lastSelection.length ||
      !currentSelection.every((id, index) => id === lastSelection[index])
    ) {
      this.lastEmittedSelection = [...currentSelection];
      const selectedAcrossPagesOnData = currentSelection.map((id) => ({
        id,
      }));
      this.selectedIds.emit(selectedAcrossPagesOnData);
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
