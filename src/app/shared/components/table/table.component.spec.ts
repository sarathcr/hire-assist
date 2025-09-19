import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import {
  initialPaginatedData,
  PaginatedData,
  PaginatedPayload,
} from '../../models/pagination.models';
import { TableDataSourceService } from './table-data-source.service';
import { TableComponent } from './table.component';

interface TestTableRow {
  [key: string]: string;
  id: string;
}

fdescribe('TableComponent', () => {
  let component: TableComponent<TestTableRow>;
  let fixture: ComponentFixture<TableComponent<TestTableRow>>;
  let service: TableDataSourceService<TestTableRow>;
  let httpMock: HttpTestingController;

  const dummyData: TestTableRow[] = [
    { id: '1', name: 'John Doe', status: 'active' },
    { id: '2', name: 'Jane Smith', status: 'inactive' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent<TestTableRow>],
      providers: [
        MessageService,
        provideAnimations(),
        TableDataSourceService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent<TestTableRow>);
    component = fixture.componentInstance;

    service = TestBed.inject<TableDataSourceService<TestTableRow>>(
      TableDataSourceService,
    );
    httpMock = TestBed.inject(HttpTestingController);

    fixture.componentRef.setInput('tableData', {
      ...initialPaginatedData,
      data: dummyData,
      pageNumber: 1,
      pageSize: 5,
      totalPages: 1,
      totalRecords: dummyData.length,
      succeeded: true,
    });

    fixture.componentRef.setInput('columnsData', {
      columns: [
        { field: 'name', header: 'Name' },
        { field: 'status', header: 'Status' },
      ],
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit edit event when onEdit is called', () => {
    spyOn(component.edit, 'emit');
    const rowData: TestTableRow = { id: '1', name: 'Test' };
    component.onEdit(rowData);
    expect(component.edit.emit).toHaveBeenCalledWith(rowData);
  });

  it('should emit delete event when onDelete is called', () => {
    spyOn(component.delete, 'emit');
    component.onDelete('1');
    expect(component.delete.emit).toHaveBeenCalledWith('1');
  });

  it('should emit view event when onView is called', () => {
    spyOn(component.view, 'emit');
    const data = { id: '2', name: 'Jane' };
    component.onView(data);
    expect(component.view.emit).toHaveBeenCalledWith(data);
  });

  it('should emit import file when onImport is called', () => {
    spyOn(component.import, 'emit');
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    component.onImport({ files: [mockFile] });
    expect(component.import.emit).toHaveBeenCalledWith(mockFile);
  });

  it('should emit selected IDs on oncheckBoxClicked', () => {
    spyOn(component.selectedIds, 'emit');
    component.selectedItems = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ] as TestTableRow[];
    component.oncheckBoxClicked();
    expect(component.selectedIds.emit).toHaveBeenCalledWith(
      component.selectedItems,
    );
  });

  it('should get severity level from status', () => {
    expect(component.getSeverity('active')).toBe('success');
    expect(component.getSeverity('inactive')).toBe('danger');
    expect(component.getSeverity('pending')).toBe('warn');
    expect(component.getSeverity('unknown')).toBe('info');
  });

  it('should clear search and emit empty payload on onClear', () => {
    spyOn(component.pageChangeAndSort, 'emit');
    component.searchValue = 'some text';
    component.onClear();
    expect(component.searchValue).toBe('');
    expect(component.pageChangeAndSort.emit).toHaveBeenCalled();
  });

  it('should emit search payload on onSearch with debounce', (done) => {
    spyOn(component.pageChangeAndSort, 'emit');
    const inputEvent = { target: { value: 'search term' } } as unknown as Event;
    component.onSearch(inputEvent);
    setTimeout(() => {
      expect(component.pageChangeAndSort.emit).toHaveBeenCalled();
      done();
    }, 500);
  });

  it('should calculate rows per page options correctly', () => {
    fixture.componentRef.setInput('tableData', {
      ...initialPaginatedData,
      totalRecords: 12,
      data: [],
      pageNumber: 1,
      pageSize: 5,
      succeeded: true,
      totalPages: 1,
      errors: [],
      message: '',
    });
    const options = component.getRowsPerPageOptions();
    expect(options).toContain(5);
    expect(options).toContain(10);
    expect(options).toContain(15);
  });

  it('should emit sorting payload when lazy load includes sortField', () => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');
    const event = {
      first: 0,
      rows: 5,
      sortField: 'name',
      sortOrder: 1,
    };
    component.isFirstLazyLoad = false;

    component.onLazyLoad(event);

    expect(emitSpy).toHaveBeenCalled();
    const payload = emitSpy.calls.mostRecent().args[0];
    expect(payload.multiSortedColumns[0]).toEqual({
      active: 'name',
      direction: 'asc',
    });
  });

  it('should emit filtering payload when filters are present', () => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');

    const event = {
      first: 0,
      rows: 10,
      filters: {
        status: [
          { value: 'active', matchMode: 'equals' },
          { value: 'pending', matchMode: 'notEquals', operator: 'or' },
        ],
      },
    };
    component.isFirstLazyLoad = false;

    component.onLazyLoad(event);

    const emitted = emitSpy.calls.mostRecent().args[0];
    expect(emitted.filterMap['status']).toContain('= active');
    expect(emitted.filterMap['status']).toContain('OR != pending');
  });

  it('should emit correct pagination values from lazy load', () => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');

    const event = {
      first: 10,
      rows: 5,
    };
    component.isFirstLazyLoad = false;

    component.onLazyLoad(event);

    const emitted = emitSpy.calls.mostRecent().args[0];
    expect(emitted.pagination.pageNumber).toBe(3);
    expect(emitted.pagination.pageSize).toBe(5);
  });

  it('should emit payload when onSearch is triggered', (done) => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');

    const event = {
      target: { value: 'developer' },
    };

    component.onSearch(event);

    setTimeout(() => {
      expect(emitSpy).toHaveBeenCalled();
      const payload = emitSpy.calls.mostRecent().args[0];
      expect(payload.filterMap['searchKey']).toBe('developer');
      done();
    }, 500);
  });

  it('should reset search and emit empty payload when cleared', () => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');

    component.searchValue = 'previous';
    component.onClear();

    expect(component.searchValue).toBe('');
    expect(emitSpy).toHaveBeenCalled();
    const payload = emitSpy.calls.mostRecent().args[0];
    expect(payload.filterMap).toEqual({});
  });

  it('should skip first lazy load emit', () => {
    spyOn(component.pageChangeAndSort, 'emit');

    component['isFirstLazyLoad'] = true;

    const event = {
      first: 0,
      rows: 5,
    };

    component.onLazyLoad(event);
    expect(component.pageChangeAndSort.emit).not.toHaveBeenCalled();
  });

  it('should handle empty columnsData gracefully', () => {
    fixture.componentRef.setInput('columnsData', { columns: [] });
    fixture.detectChanges();
    expect(component.columnsData()?.columns?.length).toBe(0);
  });

  it('should handle missing columnsData gracefully', () => {
    fixture.componentRef.setInput('columnsData', undefined as unknown);
    fixture.detectChanges();
    expect(component.columnsData()).toBeUndefined();
  });

  it('should handle empty tableData', () => {
    fixture.componentRef.setInput('tableData', {
      ...initialPaginatedData,
      data: [],
      totalRecords: 0,
    });
    fixture.detectChanges();
    expect(component.tableData()?.data.length).toBe(0);
  });

  it('should handle undefined tableData gracefully', () => {
    fixture.componentRef.setInput('tableData', undefined as unknown);
    fixture.detectChanges();
    expect(component.tableData()).toBeUndefined();
  });

  it('should disable export when exportButton is false', () => {
    fixture.componentRef.setInput('exportButton', false);
    fixture.detectChanges();
    expect(component.exportButton()).toBeFalse();
  });

  it('should handle empty alreadySelected input', () => {
    fixture.componentRef.setInput('alreadySelected', []);
    fixture.detectChanges();
    expect(component.alreadySelected().length).toBe(0);
  });

  it('should prefill selectedItems if alreadySelected is provided', () => {
    const data = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    const expectedData = [{ id: '2', name: 'Jane Smith' }];

    fixture.componentRef.setInput('tableData', {
      data,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      totalRecords: 2,
    });

    fixture.componentRef.setInput('alreadySelected', ['2']);
    fixture.detectChanges();

    expect(component.selectedItems).toEqual(expectedData);
  });

  it('should initialize selectedItems and expandedRows correctly', () => {
    expect(component.selectedItems).toEqual([]);
    expect(component.expandedRows).toEqual({});
  });

  it('should have predefined filter options', () => {
    expect(component.matchModeOptions.length).toBeGreaterThan(0);
    expect(component.statusOptions.length).toBeGreaterThan(0);
  });

  // table data source service tests

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should throw error if getData called before setting endpoint', () => {
    const payload = new PaginatedPayload();
    expect(() => service.getData(payload)).toThrowError(
      'Endpoint URL not set in TableDataSourceService.',
    );
  });

  it('should call correct endpoint with merged filters on data$', () => {
    const dummyResponse: PaginatedData<TestTableRow> = {
      data: [{ id: '1', name: 'Alice' }],
      totalRecords: 1,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 10,
      succeeded: true,
      errors: [],
      message: '',
    };

    const payload = new PaginatedPayload();
    payload.filterMap = { status: 'active' };

    service.setEndpoint('/api/data');
    service.updatePayload(payload);
    service.setExternalFilters({ role: 'admin' });

    service.data$.subscribe((data) => {
      expect(data.data.length).toBe(1);
      expect(data.data[0]['name']).toBe('Alice');
    });

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.filterMap).toEqual({
      status: 'active',
      role: 'admin',
    });

    req.flush(dummyResponse);
  });

  it('should post to the endpoint and return array on getData()', () => {
    const payload = new PaginatedPayload();
    const dummyData: TestTableRow[] = [{ id: '1', name: 'Test' }];

    service.setEndpoint('/api/test');

    service.getData(payload).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0]['name']).toBe('Test');
    });

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('POST');
    req.flush({ data: dummyData });
  });

  it('should trigger new request on refresh', () => {
    const dummyResponse: PaginatedData<TestTableRow> = {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      pageNumber: 1,
      pageSize: 10,
      succeeded: true,
      errors: [],
      message: '',
    };

    service.setEndpoint('/api/data');
    service.updatePayload(new PaginatedPayload());

    service.data$.subscribe((data) => {
      expect(data).toBeTruthy();
    });

    const initialReq = httpMock.expectOne('/api/data');
    initialReq.flush(dummyResponse);

    service.refresh();

    const refreshReq = httpMock.expectOne('/api/data');
    refreshReq.flush(dummyResponse);
  });

  it('should emit multi-sort payload when multiSortMeta is provided', () => {
    const emitSpy = spyOn(component.pageChangeAndSort, 'emit');
    const event = {
      first: 0,
      rows: 5,
      multiSortMeta: [
        { field: 'name', order: 1 },
        { field: 'status', order: -1 },
      ],
      filters: {},
    };
    component.isFirstLazyLoad = false;
    component.onLazyLoad(event);

    expect(emitSpy).toHaveBeenCalled();
    const payload = emitSpy.calls.mostRecent().args[0];
    expect(payload.multiSortedColumns.length).toBe(2);
    expect(payload.multiSortedColumns[0]).toEqual({
      active: 'name',
      direction: 'asc',
    });
    expect(payload.multiSortedColumns[1]).toEqual({
      active: 'status',
      direction: 'desc',
    });
  });
});
