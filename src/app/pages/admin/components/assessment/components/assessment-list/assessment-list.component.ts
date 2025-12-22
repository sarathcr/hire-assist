/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncPipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
import { SkeletonComponent } from '../../../../../../shared/components/assessment-card/assessment-card-skeleton';
import { AssessmentCardComponent } from '../../../../../../shared/components/assessment-card/assessment-card.component';
import { BaseComponent } from '../../../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../shared/components/dialog/dialog.component';
import { GenericDataSource } from '../../../../../../shared/components/pagination/generic-data-source';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { ASSESSMENT_URL } from '../../../../../../shared/constants/api';
import { KeyValueMap } from '../../../../../../shared/models/common.models';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../shared/models/dialog.models';
import { formatDate } from '../../../../../../shared/utilities/date.utility';
import {
  buildFormGroup,
  ConfigMap,
} from '../../../../../../shared/utilities/form.utility';
import { AssessmentForm } from '../../../../models/assessment-form.model';
import { Assessment } from '../../../../models/assessment.model';
import { AssessmentService } from '../../../../services/assessment.service';
import { CreateUpdateAssessmentModalComponent } from '../create-update-assessment-modal/create-update-assessment-modal.component';

@Component({
  selector: 'app-assessment-list',
  imports: [
    AssessmentCardComponent,
    ButtonComponent,
    PaginationComponent,
    SkeletonComponent,
    ToastModule,
    NgClass,
    AsyncPipe,
  ],
  providers: [GenericDataSource],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.scss',
})
export class AssessmentListComponent extends BaseComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public assessmentFormData = new AssessmentForm();
  public filterMap!: KeyValueMap<string>;
  public assessmentDataSource: Assessment[] = [];
  public totalRecords = 0;
  private ref: DynamicDialogRef | undefined;
  public isLoading$!: Observable<boolean>;
  public isInitialLoad = true;
  public isLoading = false;

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    public dialog: DialogService,
    public messageService: MessageService,
    private readonly assessmentService: AssessmentService,
    public router: Router,
  ) {
    super();
    this.fGroup = buildFormGroup(this.assessmentFormData);
    this.isLoading$ = this.dataSource.loading$;
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.dataSource.init(`${ASSESSMENT_URL}/assessmentsummary`);
    this.setConfigMaps();
    this.subscribeToPaginatedData();
    const sub = this.dataSource.totalRecords.subscribe((records) => {
      this.totalRecords = records;
    });

    this.subscriptionList.push(sub);
  }

  // Public Methods
  public onCreateAssessment(): void {
    this.openCreateAssessmentDialog();
  }

  public onDataSourceChange(assessmentData: Assessment[]): void {
    this.assessmentDataSource = assessmentData ?? [];
  }

  public onEditAssessment(assessment: Assessment): void {
    this.openUpdateAssessmentDialog(assessment);
  }

  public onDuplicateAssessment(assessment: Assessment): void {
    const formData = assessment;
    this.openDuplicateAssessmentDialog(formData);
  }

  public onDeleteAssessment(assessmentId: number): void {
    this.openConfirmDeleteDialog(assessmentId);
  }

  public onScheduleAssessment(assessment: Assessment): void {
    if (assessment) {
      this.router.navigate([`admin/recruitments/schedule/${assessment.id}`], {
        state: { assessment },
      });
    }
  }

  public onClickAssessment(id: number): void {
    if (id > 0) this.router.navigate([`admin/recruitments/${id}`]);
  }

  // Private Methods
  private setConfigMaps(): void {
    const { metadata } = new AssessmentForm();
    this.configMap = metadata.configMap || {};
  }

  private openCreateAssessmentDialog(): void {
    const formGroup = buildFormGroup(new AssessmentForm());

    const data = {
      fGroup: formGroup,
      configMap: this.configMap,
    };

    this.ref = this.dialog.open(CreateUpdateAssessmentModalComponent, {
      data,
      header: 'Create New Recruitment',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.createAssessment(res);
      }
    });
  }

  private openUpdateAssessmentDialog(assessment: Assessment): void {
    const formGroup = buildFormGroup(new AssessmentForm());

    const data = {
      formData: assessment,
      fGroup: formGroup,
      configMap: this.configMap,
    };

    this.ref = this.dialog.open(CreateUpdateAssessmentModalComponent, {
      data,
      header: 'Update Assessment',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.updateAssessment(res);
      }
    });
  }

  private openDuplicateAssessmentDialog(assessment: Assessment): void {
    const formGroup = buildFormGroup(new AssessmentForm());
    const formData = { ...assessment };
    formData.name = '';
    const data = {
      formData: formData,
      fGroup: formGroup,
      configMap: this.configMap,
    };

    this.ref = this.dialog.open(CreateUpdateAssessmentModalComponent, {
      data,
      header: 'Duplicate Assessment',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((res) => {
      if (res) {
        this.createAssessment(res, true);
      }
    });
  }

  private openConfirmDeleteDialog(assessmentId: number): void {
    const modalData: DialogData = this.getConfirmDeleteDialogData();

    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      width: '35vw',
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

    this.ref?.onClose.subscribe((res: boolean) => {
      if (res) {
        this.deleteAssessment(assessmentId);
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Info',
          detail: 'Deletion Cancelled',
        });
      }
    });
  }

  private createAssessment(payload: Assessment, isDuplicate?: boolean): void {
    this.isLoading = true;
    if (payload) {
      payload.startDateTime = formatDate(payload.startDateTime.toString());
      payload.endDateTime = formatDate(payload.endDateTime.toString());
      payload.isActive = true;
    }

    const next = (res: any) => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${isDuplicate ? 'Duplicated' : 'Created'} Recruitment Successfully`,
      });
      setTimeout(() => {
        this.router.navigate([`admin/recruitments/schedule/${res.id}`], {
          state: { assessment: res },
        });
        this.isLoading = false;
      }, 1500);
    };
    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
      this.isLoading = false;
    };
    this.assessmentService.createEntity(payload).subscribe({ next, error });
  }

  private updateAssessment(payload: Assessment): void {
    this.isLoading = true;
    if (payload) {
      payload.startDateTime = formatDate(payload.startDateTime.toString());
      payload.endDateTime = formatDate(payload.endDateTime.toString());
    }
    const next = (res: Assessment[]) => {
      this.assessmentDataSource = res;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Updated the  Assessment Successfully',
      });
      this.reloadPaginatedData();
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Error : ${error.error.type}`,
      });
      this.isLoading = false;
    };
    this.assessmentService
      .updateEntity('', payload, '')
      .subscribe({ next, error });
  }

  private deleteAssessment(id: number): void {
    this.isLoading = true;
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Deleted Assessment Successfully',
      });
      this.reloadPaginatedData();
      this.isLoading = false;
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'Cannot delete this recruitment because it is referenced in the recruitment steps.',
      });
      this.isLoading = false;
    };

    this.assessmentService.deleteEntityById(id).subscribe({ next, error });
  }

  private subscribeToPaginatedData(): void {
    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
      if (this.isInitialLoad && data.length > 0) {
        this.isInitialLoad = false;
      }
    });
    this.subscriptionList.push(sub);
  }

  private reloadPaginatedData(): void {
    const payload = this.dataSource.getPayloadData();
    this.dataSource.loadPaginatedData(payload);
  }

  private getConfirmDeleteDialogData(): DialogData {
    return {
      message: `Are you sure you want to delete this Assessment?`,
      isChoice: true,
      closeOnNavigation: true,
      acceptButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    };
  }
}
