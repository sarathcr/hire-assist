/* eslint-disable @typescript-eslint/no-inferrable-types */
export class PaginatedPayload {
  multiSortedColumns: SortedColumn[] = [];
  filterMap: FilterMap = {};
  pagination = new Pagination();
}

export const PaginatedPayloadinitialValues = {
  multiSortedColumns: [],
  filterMap: {},
  pagination: {
    pageNumber: 1,
    pageSize: 5,
  },
};

export type FilterMap = Record<string, string | string[] | number>;

export class SortedColumn {
  direction: 'asc' | 'desc' | '' = '';
  active: string = ''; //  active column field
}

export class Pagination {
  pageNumber: number = 1;
  pageSize: number = 5;
}

// PAGINATED DATA
export interface PaginatedData<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  data: T[];
  succeeded: boolean;
  errors: string[];
  message: string;
  metadata?: TableMetaData;
}

export interface TableMetaData {
  totals?: Total[];
}

export interface Total {
  label: string;
  value: string;
  isMultiCurrency?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initialPaginatedData: PaginatedData<any> = {
  pageNumber: 0,
  pageSize: 0,
  totalPages: 0,
  totalRecords: 0,
  data: [],
  succeeded: false,
  errors: [],
  message: '',
  metadata: {
    totals: [],
  },
};
