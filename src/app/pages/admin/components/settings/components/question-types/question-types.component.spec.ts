import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { QuestionTypesComponent } from './question-types.component';
import { QuestionTypeService } from '../../../../services/question-type.service';
import { StoreService } from '../../../../../../shared/services/store.service';
import { CollectionService } from '../../../../../../shared/services/collection.service';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';

describe('QuestionTypesComponent', () => {
  let component: QuestionTypesComponent;
  let fixture: ComponentFixture<QuestionTypesComponent>;
  let mockDialogService: jasmine.SpyObj<DialogService>;
  let mockQuestionTypeService: jasmine.SpyObj<QuestionTypeService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  let mockCollectionService: jasmine.SpyObj<CollectionService>;
  let mockTableDataSourceService: jasmine.SpyObj<TableDataSourceService<any>>;

  beforeEach(async () => {
    mockDialogService = jasmine.createSpyObj('DialogService', ['open']);
    mockQuestionTypeService = jasmine.createSpyObj('QuestionTypeService', [
      'paginationEntity',
      'addQuestionType',
      'updateQuestionType',
      'deleteQuestionType',
      'getResourceUrl',
    ]);
    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);
    mockStoreService = jasmine.createSpyObj('StoreService', ['setIsLoading']);
    mockCollectionService = jasmine.createSpyObj('CollectionService', [
      'updateCollection',
      'deleteItemFromCollection',
    ]);
    mockTableDataSourceService = jasmine.createSpyObj('TableDataSourceService', [
      'setEndpoint',
      'getData',
    ]);

    mockQuestionTypeService.paginationEntity.and.returnValue(
      of({
        data: [{ id: 1, questionType: 'Multiple Choice', createdAt: '2026-01-01' }],
        totalRecords: 1,
        pageNumber: 1,
        pageSize: 10,
      } as any),
    );
    mockTableDataSourceService.getData.and.returnValue(
      of({
        data: [{ id: 1, questionType: 'Multiple Choice', createdAt: '2026-01-01' }],
        totalRecords: 1,
        pageNumber: 1,
        pageSize: 10,
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [QuestionTypesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: DialogService, useValue: mockDialogService },
        { provide: QuestionTypeService, useValue: mockQuestionTypeService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: CollectionService, useValue: mockCollectionService },
      ],
    })
      .overrideComponent(QuestionTypesComponent, {
        set: {
          providers: [
            { provide: TableDataSourceService, useValue: mockTableDataSourceService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(QuestionTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(mockTableDataSourceService.setEndpoint).toHaveBeenCalled();
    expect(mockQuestionTypeService.paginationEntity).toHaveBeenCalled();
    expect(component.data.data.length).toBe(1);
  });

  it('should open dialog when addNewQuestionType is called', () => {
    const mockRef = {
      onClose: of({ questionType: 'Coding' }),
      close: jasmine.createSpy('close'),
    } as unknown as DynamicDialogRef;
    mockDialogService.open.and.returnValue(mockRef);
    mockQuestionTypeService.addQuestionType.and.returnValue(
      of({ id: 2, questionType: 'Coding' } as any),
    );

    component.addNewQuestionType();
    expect(mockDialogService.open).toHaveBeenCalled();
    expect(mockQuestionTypeService.addQuestionType).toHaveBeenCalledWith(
      jasmine.objectContaining({ questionType: 'Coding' }),
    );
    expect(mockCollectionService.updateCollection).toHaveBeenCalledWith(
      'questionType',
      { id: 2, title: 'Coding' },
    );
  });

  it('should open dialog when editQuestionType is called', () => {
    const mockRef = {
      onClose: of({ id: 1, questionType: 'Multiple Choice Updated' }),
      close: jasmine.createSpy('close'),
    } as unknown as DynamicDialogRef;
    mockDialogService.open.and.returnValue(mockRef);
    mockQuestionTypeService.updateQuestionType.and.returnValue(
      of({ id: 1, questionType: 'Multiple Choice Updated' } as any),
    );

    component.editQuestionType({ id: 1, questionType: 'Multiple Choice' });
    expect(mockDialogService.open).toHaveBeenCalled();
    expect(mockQuestionTypeService.updateQuestionType).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 1, questionType: 'Multiple Choice Updated' }),
    );
    expect(mockCollectionService.updateCollection).toHaveBeenCalledWith(
      'questionType',
      { id: 1, title: 'Multiple Choice Updated' },
    );
  });

  it('should open confirmation dialog and delete when deleteQuestionType is called', () => {
    const mockRef = {
      onClose: of(true),
      close: jasmine.createSpy('close'),
    } as unknown as DynamicDialogRef;
    mockDialogService.open.and.returnValue(mockRef);
    mockQuestionTypeService.deleteQuestionType.and.returnValue(of(undefined as any));

    component.deleteQuestionType(1);
    expect(mockDialogService.open).toHaveBeenCalled();
    expect(mockQuestionTypeService.deleteQuestionType).toHaveBeenCalledWith(1);
    expect(mockCollectionService.deleteItemFromCollection).toHaveBeenCalledWith(
      'questionType',
      1,
    );
  });

  it('should dispatch actions correctly from onButtonClick', () => {
    spyOn(component, 'editQuestionType');
    spyOn(component, 'deleteQuestionType');

    const mockItem: QuestionType = { id: 1, questionType: 'Multiple Choice' };
    component.onButtonClick({ event: mockItem, fName: 'Edit' });
    expect(component.editQuestionType).toHaveBeenCalledWith(mockItem);

    component.onButtonClick({ event: { id: 1 }, fName: 'Delete' });
    expect(component.deleteQuestionType).toHaveBeenCalledWith(1);
  });
});
