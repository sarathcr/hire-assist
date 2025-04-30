/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterMatchMode, MessageService, SelectItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DropdownModule } from 'primeng/dropdown';
import { FileUpload } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText, InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule, TableRowCollapseEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import {
  PaginatedData,
  PaginatedPayload,
} from '../../models/pagination.models';
import {
  ColumnField,
  PaginatedDataActions,
  TableColumnsData,
} from '../../models/table.models';
import { ButtonComponent } from '../button/button.component';
import { TableSkeletonComponent } from './table.skeleton';

export const matchOptions = [
  { label: 'Greater Than', value: FilterMatchMode.GREATER_THAN },
  { label: 'Less Than', value: FilterMatchMode.LESS_THAN },
  {
    label: 'Less Than Or Equal To',
    value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
  },
  {
    label: 'Greater Than Or Equal To',
    value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
  },
  { label: 'Equals', value: FilterMatchMode.EQUALS },
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
    FileUpload,
    DropdownModule,
    InputTextModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    InputText,
    ChipModule,
    PaginatorModule,
    CommonModule,
    SkeletonModule,
    TableSkeletonComponent,
    TagModule,
    BadgeModule,
    ButtonComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent<T extends { id: string }> implements AfterViewInit {
  // Input Properties
  public tableData = input<PaginatedData<T>>();
  public columnsData = input<TableColumnsData>();
  public heading = input<string>();
  public importButton = input<boolean>(false);
  public exportButton = input<boolean>(false);
  public SearchBar = input<boolean>(false);
  public hasAdd = input<boolean>(true);
  public hasEdit = input<boolean>(true);
  public hasDelete = input<boolean>(true);
  public hasFilter = input<boolean>(true);
  public hasView = input<boolean>(false);
  public hasRowEdit = input<boolean>(true);
  public customButton = input<boolean>(false);
  public customButtonLabel = input<string>('');

  public hideToolbar = input<boolean>(false);

  public selectedItems: { id: string }[] = [];
  public expandedRows: Record<string, boolean> = {};
  public matchModeOptions: SelectItem[] = matchOptions;
  public hasDeleteButton = input<boolean>(false);
  public hasAddButton = input<boolean>(false);
  public hasScheduleButton = input<boolean>(false);

  // Output Properties
  public create = output();
  public edit = output<any>();
  public view = output();
  public delete = output<any>();
  public selectedIds = output<string[]>();
  public deleteSelected = output<string[]>();
  public import = output<File>();
  public batchSelected = output<string[]>();
  public Schedule = output<boolean>();
  public pageChangeAndSort = output<PaginatedPayload>();
  public buttonClick = output();

  public globalFilterFields: string[] = [];
  public selectedItemsIds!: string[] | undefined;
  public PaginatedDataActions: any = PaginatedDataActions;

  constructor(private messagesService: MessageService) {
    effect(() => {
      console.log(this.tableData());
    });
  }

  ngAfterViewInit(): void {
    this.setGlobalFilterFields();
  }

  public onCreate(): void {
    this.create.emit();
  }

  public onEdit(data: any): void {
    this.edit.emit(data);
  }

  public onDelete(id: string): void {
    this.delete.emit(id);
  }

  public onButtonClick(event: any): void {
    this.buttonClick.emit(event);
  }

  public onView(data: any): void {
    this.view.emit(data);
  }

  public onImport(event: any): void {
    const file = event.files[0];
    this.import.emit(file);
  }

  public handleSchedule(): void {
    if (this.selectedItems.length > 0) {
      const selectedIdsList = this.selectedItems.map(
        (item: any) => item?.email ?? '',
      );
      this.selectedIds.emit(selectedIdsList);
    } else {
      console.warn('No items selected.');
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No items selected.',
      });
    }
  }

  public deleteSelectedItems(): void {
    if (this.selectedItems.length > 0) {
      const selectedIds = this.selectedItems.map((item) => item.id);
      this.deleteSelected.emit(selectedIds);
    } else {
      console.warn('No selected items to delete.');
      this.messagesService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No selected items to delete.',
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
    switch (status.toLowerCase()) {
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
      default:
        return 'info';
    }
  }

  public onLazyLoad(event: any): void {
    const payload: PaginatedPayload = new PaginatedPayload();
    payload.pagination.pageNumber = (event.first ?? 0) / (event.rows ?? 1) + 1;
    payload.pagination.pageSize =
      event.rows ?? this.tableData()?.pageSize ?? 10;

    if (event.sortField) {
      payload.multiSortedColumns.push({
        active: event.sortField,
        direction: event.sortOrder === 1 ? 'asc' : 'desc',
      });

      this.pageChangeAndSort.emit(payload);
    }

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
            const filterString = validConstraints
              .map((constraint, index) => {
                const operator =
                  constraint.operator?.toUpperCase() === 'OR' ? 'OR' : 'AND';
                const condition = `${this.mapMatchModeToOperator(constraint.matchMode)}${constraint.value}`;
                return index === 0 ? condition : `${operator} ${condition}`;
              })
              .join(' ');

            payload.filterMap[field] = filterString;
          }
          this.pageChangeAndSort.emit(payload);
        }
      });
    }
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

  public passSelectedItems(operation: string) {
    if (this.selectedItems && this.selectedItems.length > 0) {
      this.selectedItemsIds = this.selectedItems.map((item) => item.id ?? '');
      console.log(this.selectedItemsIds);
      if (operation === 'batch') {
        this.batchSelected.emit(this.selectedItemsIds);
      } else if (operation === 'delete') {
        this.deleteSelected.emit(this.selectedItemsIds);
      }
    } else {
      console.error('No selected items.');
    }
  }

  public onSchedule() {
    this.Schedule.emit(true);
    console.log('Schedule button clicked');
  }

  // Private methods

  private setGlobalFilterFields(): void {
    this.globalFilterFields = (this.columnsData()?.columns || [])
      .filter((col: ColumnField) => col.field && col.field !== 'actions')
      .map((col: ColumnField) => col.field);
  }

  private mapMatchModeToOperator(matchMode: string): string {
    switch (matchMode) {
      case 'equals':
        return '=';
      case 'notEquals':
        return '!=';
      case 'lt':
        return '<';
      case 'lte':
        return '<=';
      case 'gt':
        return '>';
      case 'gte':
        return '>=';
      default:
        return '=';
    }
  }
}
