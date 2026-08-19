/* eslint-disable @typescript-eslint/no-explicit-any */
import { AsyncPipe, NgClass } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';
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
  ConfigMap,
  buildFormGroup,
} from '../../../../../../shared/utilities/form.utility';
import { AssessmentForm } from '../../../../models/assessment-form.model';
import { Assessment } from '../../../../models/assessment.model';
import { AssessmentService } from '../../../../services/assessment.service';
import { CreateUpdateAssessmentModalComponent } from '../create-update-assessment-modal/create-update-assessment-modal.component';
import { StepsStatusService, StepStatus } from '../../services/steps-status.service';
import { RecruitmentChoiceModalComponent } from '../recruitment-choice-modal/recruitment-choice-modal.component';
import { SkeletonComponent } from '../../../../../../shared/components/assessment-card/assessment-card-skeleton';
import { EmptyStateComponent } from "../../../../../../shared/components/empty-state/empty-state/empty-state.component";
import { SearchBarComponent } from '../../../../../../shared/components/search-bar/search-bar/search-bar.component';

@Component({
  selector: 'app-assessment-list',
  imports: [
    AssessmentCardComponent,
    ButtonComponent,
    PaginationComponent,
    NgClass,
    SkeletonComponent,
    AsyncPipe,
    EmptyStateComponent,
    SearchBarComponent,
    MenuModule,
    ButtonModule,
    FormsModule,
    TooltipModule,
  ],
  providers: [GenericDataSource],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.scss',
})
export class AssessmentListComponent extends BaseComponent implements OnInit {
  public fGroup!: FormGroup;
  public configMap!: ConfigMap;
  public assessmentFormData = new AssessmentForm();
  public filterMap: KeyValueMap<string> = {};
  public assessmentDataSource: Assessment[] = [];
  public totalRecords = 0;
  private ref: DynamicDialogRef | undefined;
  private route = inject(ActivatedRoute);
  public isInitialLoad = true;
  public isLoading = false;
  public isLoading$!: Observable<boolean>;
  public paginationFirst = 0;
  
  @ViewChild(SearchBarComponent) searchBar!: SearchBarComponent;
  
  public displayMenuItems: MenuItem[] = [];
  public selectedStatus: string = 'All';
  public selectedSortField: string | null = null;
  public selectedSortOrder: 'asc' | 'desc' | '' = '';
  public sortRef: { active: string; direction: 'asc' | 'desc' | '' } = { active: '', direction: '' };

  constructor(
    public dataSource: GenericDataSource<AssessmentForm>,
    public dialog: DialogService,
    public messageService: MessageService,
    private readonly assessmentService: AssessmentService,
    private readonly stepsStatusService: StepsStatusService,
    public router: Router
  ) {
    super();
    this.fGroup = buildFormGroup(this.assessmentFormData);
    this.isLoading$ = this.dataSource.loading$;
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    const stateStatus = history.state?.status;
    const statusParam = stateStatus || this.route.snapshot.queryParamMap.get('status');
    if (statusParam) {
      this.selectedStatus = statusParam;
      this.filterMap['status'] = statusParam;
    }

    this.dataSource.init(`${ASSESSMENT_URL}/assessmentsummary`);
    this.setConfigMaps();
    this.subscribeToPaginatedData();
    const sub = this.dataSource.totalRecords.subscribe((records) => {
      this.totalRecords = records;
    });

    this.subscriptionList.push(sub);

    this.updateDisplayMenuItems();
  }

  private updateDisplayMenuItems(): void {
    const getFilterStyleClass = (status: string | null) => {
      const current = this.selectedStatus || 'All';
      const target = status || 'All';
      return current === target ? 'active-filter-item' : '';
    };
    const getSortStyleClass = (field: string, direction: 'asc' | 'desc') => 
      (this.selectedSortField === field && this.selectedSortOrder === direction) ? 'active-filter-item' : '';

    this.displayMenuItems = [
      {
        label: 'Sort By',
        items: [
          { label: 'Default (Unsorted)', icon: 'pi pi-sort-alt', styleClass: this.selectedSortField === null ? 'active-filter-item' : '', command: () => this.onClearSort() },
          { label: 'Name (A-Z)', icon: 'pi pi-sort-alpha-down', styleClass: getSortStyleClass('name', 'asc'), command: () => this.onSort('name', 'asc') },
          { label: 'Name (Z-A)', icon: 'pi pi-sort-alpha-up', styleClass: getSortStyleClass('name', 'desc'), command: () => this.onSort('name', 'desc') },
          { label: 'Start Date (Newest)', icon: 'pi pi-calendar-minus', styleClass: getSortStyleClass('startDateTime', 'desc'), command: () => this.onSort('startDateTime', 'desc') },
          { label: 'Start Date (Oldest)', icon: 'pi pi-calendar-plus', styleClass: getSortStyleClass('startDateTime', 'asc'), command: () => this.onSort('startDateTime', 'asc') },
          { label: 'End Date (Newest)', icon: 'pi pi-calendar-minus', styleClass: getSortStyleClass('endDateTime', 'desc'), command: () => this.onSort('endDateTime', 'desc') },
          { label: 'End Date (Oldest)', icon: 'pi pi-calendar-plus', styleClass: getSortStyleClass('endDateTime', 'asc'), command: () => this.onSort('endDateTime', 'asc') }
        ]
      },
      {
        label: 'Filter Status',
        items: [
          { label: 'Default (All)', icon: 'pi pi-list', styleClass: getFilterStyleClass(null), command: () => this.onStatusFilter(null) },
          { label: 'Active', icon: 'pi pi-play', styleClass: getFilterStyleClass('Active'), command: () => this.onStatusFilter('Active') },
          { label: 'Inactive', icon: 'pi pi-pause', styleClass: getFilterStyleClass('Inactive'), command: () => this.onStatusFilter('Inactive') },
          { label: 'Completed', icon: 'pi pi-check-circle', styleClass: getFilterStyleClass('Completed'), command: () => this.onStatusFilter('Completed') }
        ]
      },
      {
        label: 'Actions',
        items: [
          { label: 'Reset All', icon: 'pi pi-refresh', disabled: !this.hasActiveDisplayModifiers(), command: () => this.onResetAll() }
        ]
      }
    ];
  }

  public onSort(field: string, direction: 'asc' | 'desc'): void {
    this.selectedSortField = field;
    this.selectedSortOrder = direction;
    this.sortRef = { active: field, direction: direction };
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public onClearSort(): void {
    this.selectedSortField = null;
    this.selectedSortOrder = '';
    this.sortRef = { active: '', direction: '' };
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public openMenu(event: Event, menu: any): void {
    event.stopPropagation();
    menu.toggle(event);
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

  public onDeleteAssessment(assessmentId: number): void {
    this.openConfirmDeleteDialog(assessmentId);
  }

  public onSearch(searchTerm: string): void {
    const newFilterMap = { ...this.filterMap };

    if (searchTerm && searchTerm.trim().length > 0) {
      newFilterMap['searchKey'] = searchTerm.trim();
    } else {
      delete newFilterMap['searchKey'];
    }

    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public onStatusFilter(status: string | null): void {
    const finalStatus = status || 'All';
    this.selectedStatus = finalStatus;
    const newFilterMap = { ...(this.filterMap || {}) };

    if (finalStatus !== 'All') {
      newFilterMap['status'] = finalStatus;
    } else {
      delete newFilterMap['status'];
    }

    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public hasActiveDisplayModifiers(): boolean {
    return !!(this.hasSearchKey() || (this.selectedStatus && this.selectedStatus !== 'All') || this.selectedSortField);
  }

  public hasSearchKey(): boolean {
    return !!(this.filterMap['searchKey'] && this.filterMap['searchKey'].trim().length > 0);
  }

  public getSortLabel(): string {
    if (!this.selectedSortField) return '';
    const direction = this.selectedSortOrder === 'asc' ? 'A-Z' : 'Z-A';
    const dateDir = this.selectedSortOrder === 'asc' ? 'Oldest' : 'Newest';
    if (this.selectedSortField === 'name') return `Name (${direction})`;
    if (this.selectedSortField === 'startDateTime') return `Start Date (${dateDir})`;
    if (this.selectedSortField === 'endDateTime') return `End Date (${dateDir})`;
    return `${this.selectedSortField}`;
  }

  public clearSearch(): void {
    if (this.searchBar) {
      this.searchBar.clear();
    }
    const newFilterMap = { ...this.filterMap };
    delete newFilterMap['searchKey'];
    this.filterMap = newFilterMap;
    this.paginationFirst = 0;
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    this.dataSource.loadPaginatedData(payload);
  }

  public clearStatusFilter(): void {
    this.onStatusFilter(null);
  }

  public clearSort(): void {
    this.onClearSort();
  }

  public onResetAll(): void {
    this.selectedStatus = 'All';
    this.selectedSortField = null;
    this.selectedSortOrder = '';
    this.sortRef = { active: '', direction: '' };
    this.filterMap = {};
    this.paginationFirst = 0;

    if (this.searchBar) {
      this.searchBar.clear();
    }
    this.updateDisplayMenuItems();

    const payload = this.dataSource.getPayloadData();
    payload.pagination.pageNumber = 1;
    payload.filterMap = this.filterMap;
    payload.sortedColumn = this.sortRef;
    this.dataSource.loadPaginatedData(payload);
  }

  public onScheduleAssessment(assessment: Assessment): void {
    if (assessment && assessment.id) {
      this.handleRecruitmentNavigation(assessment.id, assessment);
    }
  }

  public onClickAssessment(assessment: Assessment): void {
    if (assessment && assessment.id && assessment.id > 0) {
      this.handleRecruitmentNavigation(assessment.id, assessment);
    }
  }

  private handleRecruitmentNavigation(id: number, assessment?: Assessment): void {
    this.isLoading = true;
    this.stepsStatusService.getAssessmentStepsStatus(id).subscribe({
      next: (status: StepStatus) => {
        this.isLoading = false;
        const isScheduleCompleted = status.schedule === 'Completed';

        if (isScheduleCompleted) {
          this.showRecruitmentChoice(id, status, assessment);
        } else {
          this.router.navigate([`admin/recruitments/schedule/${id}`], {
            state: { assessment, stepsStatus: status },
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate([`admin/recruitments/schedule/${id}`], {
          state: { assessment },
        });
      }
    });
  }

  private showRecruitmentChoice(id: number, status: StepStatus, assessment?: Assessment): void {
    this.ref = this.dialog.open(RecruitmentChoiceModalComponent, {
      header: 'Selection Required',
      width: '450px',
      modal: true,
      closable: true,
      dismissableMask: true,
      showHeader: false, // We have a custom header in the template
      styleClass: 'choice-dialog',
      breakpoints: {
        '640px': '90vw',
      }
    });

    this.ref.onClose.subscribe((choice: 'schedule' | 'detail') => {
      if (choice === 'schedule') {
        this.router.navigate([`admin/recruitments/schedule/${id}`], {
          state: { assessment, stepsStatus: status },
        });
      } else if (choice === 'detail') {
        this.router.navigate([`admin/recruitments/${id}`]);
      }
    });
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
      styleClass: 'standard-dialog-wrapper',
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
      header: 'Update Recruitment',
      width: '50vw',
      modal: true,
      focusOnShow: false,
      styleClass: 'standard-dialog-wrapper',
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
        detail: 'Deleted Recruitment Successfully',
      });
      this.reloadPaginatedData();
      this.isLoading = false;
    };
    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          error.error?.type ||
          error.error?.message ||
          error.error?.errorValue ||
          'Cannot delete this recruitment because it is referenced in the recruitment steps.',
      });
      this.isLoading = false;
    };

    this.assessmentService.deleteEntityById(id).subscribe({ next, error });
  }

  private subscribeToPaginatedData(): void {
    let hasReceivedData = false;
    let hasStartedLoading = false;

    const sub = this.dataSource.connect().subscribe((data) => {
      this.assessmentDataSource = data;
      hasReceivedData = true;
      // Set isLoading to false when data arrives
      this.isLoading = false;
    });
    this.subscriptionList.push(sub);

    // Track loading state to set isInitialLoad to false when loading completes
    const loadingSub = this.dataSource.loading$.subscribe((isLoading) => {
      // Update isLoading based on dataSource loading state
      this.isLoading = isLoading;

      if (isLoading) {
        hasStartedLoading = true;
      }
      
      // Set isInitialLoad to false when loading completes AND we have received data
      if (!isLoading && this.isInitialLoad && hasStartedLoading && hasReceivedData) {
        this.isInitialLoad = false;
      }
    });
    this.subscriptionList.push(loadingSub);
  }

  private reloadPaginatedData(): void {
    const payload = this.dataSource.getPayloadData();
    this.dataSource.loadPaginatedData(payload);
  }

  private getConfirmDeleteDialogData(): DialogData {
    return {
      message: `Are you sure you want to delete this recruitment?`,
      isChoice: true,
      closeOnNavigation: true,
      acceptButtonText: 'Yes',
      cancelButtonText: 'Cancel',
    };
  }

  public get isMobileOrTablet(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 1024;
  }
}
