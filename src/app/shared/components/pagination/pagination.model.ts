import { Observable } from 'rxjs';
import { KeyValueMap } from '../../models/common.models';

export interface PaginatedDataSource {
  loading$: Observable<boolean>;
  totalPages$: Observable<number>;
  totalRecords$: Observable<number>;
  loadPaginatedData: (payload: PaginatedDataPayload) => void;
}

export interface PaginatedDataPayload {
  sortedColumn: {
    active: string;
    direction: 'asc' | 'desc' | '';
  };
  filterMap: KeyValueMap<string | number>;
  sumFilter?: {
    propertyName: string;
  };
  pagination: {
    pageNumber: number;
    pageSize: number;
  };
}
