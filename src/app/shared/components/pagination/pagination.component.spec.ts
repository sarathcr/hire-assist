import { SimpleChanges } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PaginatorModule } from 'primeng/paginator';
import { of } from 'rxjs';
import { KeyValueMap } from '../../models/common.models';
import { GenericDataSource } from './generic-data-source';
import { PaginationComponent } from './pagination.component';
import { PaginatedService } from './pagination.service';

// DummyData interface
export interface DummyData {
  id: string;
  [key: string]: string | number;
}

// Mocked PaginatedData<T>
const mockPaginatedData = {
  totalPages: 2,
  totalRecords: 100,
  data: [
    { id: '1', name: 'Test 1' },
    { id: '2', name: 'Test 2' },
  ] as DummyData[],
};

// Mock DataSource
class MockDataSource extends GenericDataSource<DummyData> {
  override connect = jasmine
    .createSpy()
    .and.returnValue(of(mockPaginatedData.data));
  override loadPaginatedData = jasmine.createSpy();
}

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;
  let mockDataSource: MockDataSource;
  let mockService: PaginatedService<DummyData>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('PaginatedService', ['getData']);
    mockDataSource = new MockDataSource(mockService);

    await TestBed.configureTestingModule({
      imports: [PaginationComponent, PaginatorModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    component.dataSource = mockDataSource;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call dataSource.connect on init', () => {
    expect(mockDataSource.connect).toHaveBeenCalled();
  });

  it('should call loadDataSource on ngAfterViewInit', fakeAsync(() => {
    spyOn(
      component as unknown as { loadDataSource: () => void },
      'loadDataSource',
    );
    component.ngAfterViewInit();
    tick(151);
    expect(
      (component as unknown as { loadDataSource: () => void }).loadDataSource,
    ).toHaveBeenCalled();
  }));

  it('should emit filterChange and call loadPaginatedData', () => {
    spyOn(component.filterChange, 'emit');
    // @ts-expect-error: access to protected/private method for testing
    component.loadDataSource();
    expect(component.filterChange.emit).toHaveBeenCalled();
    expect(mockDataSource.loadPaginatedData).toHaveBeenCalled();
  });

  it('should handle pagination page change', () => {
    spyOn(
      component as unknown as { loadDataSource: () => void },
      'loadDataSource',
    );
    component.onPageChange({ first: 10, rows: 5 });
    expect(component.first).toBe(10);
    expect(component.rows).toBe(5);
    expect(
      (component as unknown as { loadDataSource: () => void }).loadDataSource,
    ).toHaveBeenCalled();
  });

  it('should update filter state on search', () => {
    const searchSpy = spyOn(
      component['search'] as { next: (value?: unknown) => void },
      'next',
    );
    component.filterState = { a: '1' };
    component.onSearch({ b: '2' });
    expect(component.filterState).toEqual({ a: '1', b: '2' });
    expect(searchSpy).toHaveBeenCalled();
  });

  it('should ignore "change" event type in onSearch', () => {
    // @ts-expect-error: access to protected/private method for testing
    const searchSpy = spyOn((component as PaginationComponent).search, 'next');
    component.filterState = { a: '1' };
    component.onSearch({ type: 'change' } as KeyValueMap<string>);
    expect(component.filterState).toEqual({ a: '1' });
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('should call onSearch on filterMap change (ngOnChanges)', () => {
    spyOn(component, 'onSearch');
    component.ngOnChanges({
      filterMap: {
        currentValue: { name: 'Test' },
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(component.onSearch).toHaveBeenCalledWith({ name: 'Test' });
  });

  it('should trigger search if forceUpdate changes (ngOnChanges)', () => {
    // @ts-expect-error: access to protected/private method for testing
    const searchSpy = spyOn((component as PaginationComponent).search, 'next');
    component.ngOnChanges({
      forceUpdate: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(searchSpy).toHaveBeenCalled();
  });

  it('should calculate correct pageNumber and emit in getPayloadData', () => {
    component.first = 20;
    component.rows = 10;
    component.sortRef = { active: 'id', direction: 'desc' };
    component.filterState = { foo: 'bar' };
    spyOn(component.filterChange, 'emit');
    // @ts-expect-error: access to protected/private method for testing
    const payload = (component as PaginationComponent).getPayloadData();
    expect(payload.pagination.pageNumber).toBe(3);
    expect(payload.pagination.pageSize).toBe(10);
    expect(payload.sortedColumn.active).toBe('id');
    expect(payload.sortedColumn.direction).toBe('desc');
    expect(payload.filterMap).toEqual({ foo: 'bar' });
    expect(component.filterChange.emit).toHaveBeenCalledWith(payload);
  });

  it('should render paginator component', () => {
    const paginator = fixture.debugElement.query(By.css('p-paginator'));
    expect(paginator).toBeTruthy();
  });

  it('should bind paginator inputs', () => {
    component.first = 5;
    component.rows = 10;
    component.totalRecords = 100;
    fixture.detectChanges();
    const paginator = fixture.debugElement.query(By.css('p-paginator'));
    expect(paginator.componentInstance.first).toBe(5);
    expect(paginator.componentInstance.rows).toBe(10);
    expect(paginator.componentInstance.totalRecords).toBe(100);
  });

  it('should call onPageChange from paginator output', () => {
    spyOn(component, 'onPageChange');
    const paginator = fixture.debugElement.query(By.css('p-paginator'));
    paginator.triggerEventHandler('onPageChange', { first: 10, rows: 20 });
    expect(component.onPageChange).toHaveBeenCalledWith({
      first: 10,
      rows: 20,
    });
  });

  it('should handle empty data response gracefully', () => {
    mockDataSource.connect = jasmine.createSpy().and.returnValue(of([]));
    fixture.detectChanges();
    const paginator = fixture.debugElement.query(By.css('p-paginator'));
    expect(paginator).toBeTruthy();
  });

  it('should default to 0 for first and 10 for rows if not set', () => {
    expect(component.first).toBe(0);
    expect(component.rows).toBe(10);
  });

  it('should handle undefined filterMap gracefully', () => {
    component.filterMap = undefined!;
    expect(() => component.ngOnChanges({} as SimpleChanges)).not.toThrow();
  });

  it('should handle undefined sortRef in getPayloadData', () => {
    component.sortRef = undefined!;
    // @ts-expect-error - private access
    const payload = component.getPayloadData();
    expect(payload.sortedColumn).toEqual({ active: '', direction: '' });
  });

  it('should handle null paginatedData in loadPaginatedData gracefully', fakeAsync(() => {
    mockDataSource.loadPaginatedData = jasmine.createSpy();
    const spyLoad = spyOn(
      component as unknown as { loadDataSource: () => void },
      'loadDataSource',
    ).and.callThrough();
    component.ngOnInit();
    component['search'].next();

    tick(151);

    expect(spyLoad).toHaveBeenCalled();
    expect(mockDataSource.loadPaginatedData).toHaveBeenCalled();
  }));
});
