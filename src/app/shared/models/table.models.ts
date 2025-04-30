export interface TableColumnsData {
  columns: ColumnField[];
  displayedColumns: string[];
  hasExpanded?: boolean;
}

export interface ColumnField {
  field: string;
  displayName: string;
  fieldType?: FieldType;
  columnType?: ColumnType;
  actions?: PaginatedDataActions[];
  actionsConfig?: ActionConfig;
  sortedColumn?: boolean;
  hasChip?: boolean;
  hasFilter?: boolean;
  buttonLabel?: string;
  buttonClick?: (cell: unknown) => void;
}

export enum FieldType {
  String = 'string',
  CheckBox = 'checkbox',
  BooleanToString = 'booleanToString',
  StringToDate = 'stringToDate',
  StringToDateTime = 'stringToDateTime',
  StringToDecimal = 'stringToDecimal',
  ListLength = 'listLength',
  Action = 'action',
  Button = 'button',
}

export enum ColumnType {
  ExtraSmall = 'extra-small',
  Small = 'small-column',
  Medium = 'medium-column',
  Large = 'large-column',
}

export enum PaginatedDataActions {
  Add = 'add',
  Delete = 'delete',
  Review = 'review',
  Edit = 'edit',
  View = 'download',
  Postpone = 'postpone',
  Manage = 'manage',
  Preview = 'visibility',
}

export type ActionConfig = Record<string, BaseActionConfig>;

export interface BaseActionConfig {
  disabled: boolean;
}

export interface PaginatedData<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  data: T[];
  sum: string;
  succeeded: boolean;
  errors: string[];
  message: string;
}
