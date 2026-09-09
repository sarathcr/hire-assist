/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs/operators';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../shared/components/table/table-data-source.service';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import {
  getDefaultPayload,
  PaginatedData,
  PaginatedPayload,
  setSavedPayload,
} from '../../../../../../shared/models/pagination.models';
import {
  FieldType,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { CollectionService } from '../../../../../../shared/services/collection.service';
import { StoreService } from '../../../../../../shared/services/store.service';
import {
  ConfigMap,
  buildFormGroup,
} from '../../../../../../shared/utilities/form.utility';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';

import { QuestionTypeForm } from '../../../../models/question-type-form.model';
import { QuestionType } from '../../../../models/question-type.model';
import { QuestionTypeService } from '../../../../services/question-type.service';
import { QuestionTypeDialogComponent } from './components/question-type-dialog/question-type-dialog.component';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'questionType',
      displayName: 'Question Type',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'createdAt',
      displayName: 'Created At',
      fieldType: FieldType.StringToDate,
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: false,
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: ['pi pi-pencil', 'pi pi-trash'],
      buttonLabels: ['Edit', 'Delete'],
      buttonTooltips: ['Edit', 'Delete'],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: ['questionType', 'createdAt', 'actions'],
};

@Component({
  selector: 'app-question-types',
  imports: [TableComponent, ButtonComponent],
  providers: [TableDataSourceService],
  templateUrl: './question-types.component.html',
  styleUrl: './question-types.component.scss',
})
export class QuestionTypesComponent implements OnInit, OnDestroy {
  public url = 'QuestionType/QuestionTypeSummary';
  public data!: PaginatedData<any>;
  public columns: TableColumnsData = tableColumns;
  public fGroup!: FormGroup;
  public questionTypeFormData = new QuestionTypeForm();
  public configMap!: ConfigMap;
  public isLoading = true;
  private currentPayload: PaginatedPayload = new PaginatedPayload();
  private previousFilterMap: any = {};
  private ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    private questionTypeService: QuestionTypeService,
    public messageService: MessageService,
    private storeService: StoreService,
    private dataSourceService: TableDataSourceService<any>,
    private readonly collectionService: CollectionService,
  ) {
    this.fGroup = buildFormGroup(this.questionTypeFormData);
  }

  ngOnInit(): void {
    this.setPaginationEndpoint();
    const initialPayload = getDefaultPayload('questionTypes');
    this.currentPayload = initialPayload;
    this.getAllPaginatedQuestionTypes(initialPayload);
    this.setConfigMaps();
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    const isSearch =
      JSON.stringify(payload.filterMap) !==
      JSON.stringify(this.previousFilterMap);

    if (isSearch) {
      payload.pagination.pageNumber = 1;
    }

    this.previousFilterMap = JSON.parse(JSON.stringify(payload.filterMap));
    this.currentPayload = payload;
    setSavedPayload('questionTypes', payload);
    this.loadData(payload);
  }

  public addNewQuestionType(): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(QuestionTypeDialogComponent, {
      data: data,
      header: 'Create Question Type',
      width: '40vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '65vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((res: QuestionType) => {
      document.body.style.overflow = 'auto';
      if (res) {
        this.createQuestionType(res);
      }
      this.fGroup.reset();
    });
  }

  public editQuestionType(questionTypeData: QuestionType): void {
    const data = {
      fGroup: this.fGroup,
      configMap: this.configMap,
      formData: questionTypeData,
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(QuestionTypeDialogComponent, {
      data: data,
      header: 'Update Question Type',
      width: '40vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '65vw',
        '640px': '90vw',
      },
    });

    this.ref.onClose.subscribe((res: QuestionType) => {
      document.body.style.overflow = 'auto';
      if (res) {
        this.updateQuestionType(res);
      }
      this.fGroup.reset();
    });
  }

  public deleteQuestionType(idOrItem: any): void {
    const id =
      typeof idOrItem === 'object' && idOrItem !== null
        ? idOrItem.id
        : idOrItem;

    const modalData: DialogData = {
      message: 'Are you sure you want to delete this question type?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    document.body.style.overflow = 'hidden';
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '25vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        footer: DialogFooterComponent,
      },
    });

    this.ref.onClose.subscribe((result) => {
      document.body.style.overflow = 'auto';
      if (result) {
        this.deleteQuestionTypeItem(Number(id));
      }
      this.fGroup.reset();
    });
  }

  public onButtonClick(data: { event: any; fName: string }): void {
    const { event, fName } = data;
    switch (fName) {
      case 'Edit':
        this.editQuestionType(event);
        break;
      case 'Delete':
        this.deleteQuestionType(event.id);
        break;
      default:
        break;
    }
  }

  public getAllPaginatedQuestionTypes(payload: PaginatedPayload): void {
    this.isLoading = true;
    const next = (res: any) => {
      if (res) {
        this.data = res;
      }
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error?.error?.type || 'Failed to fetch question types'}`,
      });
    };

    this.questionTypeService
      .paginationEntity(`${this.url}`, payload)
      .subscribe({ next, error });
  }

  private loadData(payload: PaginatedPayload): void {
    this.isLoading = true;
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: any) => {
        this.data = response;
      });
  }

  private setPaginationEndpoint(): void {
    this.dataSourceService.setEndpoint(`${ASSESSMENT_URL}/${this.url}`);
  }

  private setConfigMaps(): void {
    const { metadata } = new QuestionTypeForm();
    this.configMap = metadata.configMap || {};
  }

  private createQuestionType(payload: QuestionType): void {
    this.isLoading = true;
    if (payload) {
      payload.questionType = payload.questionType?.trim();
    }

    const next = (res: any) => {
      this.storeService.setIsLoading(false);
      const questionTypeData = (res as QuestionType) || payload;
      if (questionTypeData && questionTypeData.id) {
        this.collectionService.updateCollection('questionType', {
          id: Number(questionTypeData.id),
          title: questionTypeData.questionType,
        });
      }
      this.isLoading = false;
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Created Question Type Successfully',
        });
      }, 200);
      this.getAllPaginatedQuestionTypes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.isLoading = false;
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          error.error?.type ||
          error.error?.message ||
          error.error?.errorValue ||
          'Creation failed',
      });
    };

    this.questionTypeService.addQuestionType(payload).subscribe({ next, error });
  }

  private updateQuestionType(payload: QuestionType): void {
    this.isLoading = true;
    if (payload) {
      payload.questionType = payload.questionType?.trim();
    }

    const next = (res: any) => {
      this.storeService.setIsLoading(false);
      const questionTypeData = (res as QuestionType) || payload;
      if (questionTypeData && questionTypeData.id) {
        this.collectionService.updateCollection('questionType', {
          id: Number(questionTypeData.id),
          title: questionTypeData.questionType,
        });
      }
      this.isLoading = false;
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Question Type Updated Successfully',
        });
      }, 200);
      this.getAllPaginatedQuestionTypes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.isLoading = false;
      this.storeService.setIsLoading(false);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          error.error?.type ||
          error.error?.message ||
          error.error?.errorValue ||
          'Update failed',
      });
    };

    this.questionTypeService.updateQuestionType(payload).subscribe({ next, error });
  }

  private deleteQuestionTypeItem(id: number): void {
    this.isLoading = true;
    const next = () => {
      this.storeService.setIsLoading(false);
      this.collectionService.deleteItemFromCollection('questionType', id);
      this.isLoading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted Question Type Successfully',
      });
      this.getAllPaginatedQuestionTypes(this.currentPayload);
    };

    const error = (error: HttpErrorResponse) => {
      this.storeService.setIsLoading(false);
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          error.error?.type ||
          error.error?.message ||
          error.error?.errorValue ||
          'Deletion failed',
      });
    };

    this.questionTypeService.deleteQuestionType(id).subscribe({ next, error });
  }
}
