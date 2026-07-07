/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, computed, input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';

import { TooltipModule } from 'primeng/tooltip';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../../../../../../../shared/components/dialog/dialog.component';
import { TableDataSourceService } from '../../../../../../../../shared/components/table/table-data-source.service';
import { TableComponent } from '../../../../../../../../shared/components/table/table.component';
import { HistoryDrawerComponent } from '../../../../../../../../shared/components/history-drawer/history-drawer.component';
import { ASSESSMENT_URL } from '../../../../../../../../shared/constants/api';
import { CustomErrorResponse } from '../../../../../../../../shared/models/custom-error.models';
import { DialogData } from '../../../../../../../../shared/models/dialog.models';
import { Option } from '../../../../../../../../shared/models/app-state.models';
import { PaginatedPayload } from '../../../../../../../../shared/models/pagination.models';
import {
  FieldType,
  PaginatedData,
  PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../../../shared/models/table.models';
import {
  groupCandidatesByContact,
  parseCsvToJson,
} from '../../../../../../../../shared/utilities/csvParse.utility';
import {
  CandidateApplicationQuestions,
  CandidateImportResponseDto,
  CandidateModel,
} from '../../../../../../models/candidate-data.model';
import { QuestionSetModel } from '../../../../../../models/question.model';
import { AssessmentService } from '../../../../../../services/assessment.service';
import { CandidateService } from '../../../../services/candidate.service';
import { QuestionSetStateService } from '../../../../services/question-set-state.service';
import { AssessmentViewModel } from '../../assessment-view.component';
import { CandidateDialogComponent } from '../candidate-dialog/candidate-dialog.component';
import { ManageDuplicateRecordsComponent } from '../manage-duplicate-records/manage-duplicate-records.component';
import { StoreService } from '../../../../../../../../shared/services/store.service';
import { StepsStatusService } from '../../../../services/steps-status.service';
import { finalize } from 'rxjs/operators';

const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'currentLocation',
      displayName: 'Location',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'aadhaarNumber',
      displayName: 'Aadhaar Number',
      fieldType: FieldType.Masked,
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'textFilter',
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasChip: false,
      hasTextFilter: true,
      filterAlias: 'selectFilterEnrolled',
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Action,
      buttonIcons: [
        'pi pi-eye',
        'pi pi-trash',
        'pi pi-history',
        'pi pi-calendar-clock',
      ],
      buttonLabels: ['View', 'Delete', 'History', 'Previous Recruitments'],
      buttonTooltips: ['View', 'Delete', 'History', 'Previous Recruitments'],
      sortedColumn: false,
      hasChip: false,
    },
  ],
  displayedColumns: [],
};
@Component({
  selector: 'app-import-candidate-list-step',
  imports: [
    TableComponent,
    HistoryDrawerComponent,
    FileUpload,
    ButtonComponent,
    TooltipModule,
  ],
  templateUrl: './import-candidate-list-step.component.html',
  styleUrl: './import-candidate-list-step.component.scss',
  providers: [TableDataSourceService],
})
export class ImportCandidateListStepComponent implements OnInit {
  @ViewChild(TableComponent) tableComponent!: TableComponent<any>;

  public url = `${ASSESSMENT_URL}/candidates/all`;
  public data!: PaginatedData<CandidateModel>;
  public fGroup!: FormGroup;
  public duplicateRecords: unknown[] = [];
  public isUploading = false;
  public assessmentId = input<number>();
  public isReadOnly = input<boolean>(false);
  public selectedUsers: (string | undefined)[] = [];
  public selectedCandidates: CandidateModel[] = [];
  public disableScheduleButton = true;
  public importStatus = false;
  public newStatus = false;
  public isLoading = false;
  public disableDeleteSelectedButton = true;
  public tooltipMessage = '';
  public alreadySelectedCandidates: string[] = [];
  public visible: boolean = false;
  public historyEvents: any[] = [];
  public historyLoading: boolean = false;
  public historyPagination = {
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0
  };
  public currentHistoryCandidateId: string | null = null;
  private skipAutoSelection = false;

  public columns = computed(() => {
    if (this.isReadOnly()) {
      return {
        ...tableColumns,
        columns: tableColumns.columns.map((col) => {
          if (col.field === 'actions') {
            return {
              ...col,
              actions: col.actions?.filter(
                (action) => action !== PaginatedDataActions.Delete,
              ),
            };
          }
          return col;
        }),
      };
    }
    return tableColumns;
  });

  private questionSets!: QuestionSetModel[];
  private ref: DynamicDialogRef | undefined;
  private candidateApplicationQuestions!: CandidateApplicationQuestions[];

  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly messageService: MessageService,
    private readonly candidateService: CandidateService,
    private readonly dataSourceService: TableDataSourceService<CandidateModel>,
    public dialog: DialogService,
    private readonly router: Router,
    private readonly questionSetStateService: QuestionSetStateService,
    private readonly storeService: StoreService,
    private readonly stepsStatusService: StepsStatusService,
  ) {
    // Inject computed values if needed or handle logic
  }
  ngOnInit(): void {
    this.setPaginationEndpoint();
    this.getAllCandidates(new PaginatedPayload());
    this.getAllQuestionSets(new PaginatedPayload());
    this.getAllCandidatesApplicationQuestions();
  }

  public onButtonClick(event: any) {
    const action = event.fName;
    const candidate = event.event;

    switch (action) {
      case 'View':
        this.onView(candidate);
        break;
      case 'Delete':
        this.deleteCandidate(candidate.id);
        break;
      case 'History':
        this.viewHistory(candidate);
        break;
      case 'Previous Recruitments':
        this.onPreviousAssessment(candidate);
        break;
    }
  }

  public deleteCandidate(userId: string) {
    const modalData: DialogData = {
      message: 'Are you sure you want to delete the candidate?',
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
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
      if (result) {
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Candidate Successfully',
          });
          this.getAllCandidates(new PaginatedPayload(), true);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          this.errorMessage(error);
        };
        this.candidateService
          .deleteEntityById(userId, this.assessmentId())
          .subscribe({ next, error });
      }
    });
  }
  public getAllCandidates(payload: PaginatedPayload, clearLoading = false) {
    this.isLoading = true;
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };
    const next = (res: PaginatedData<CandidateModel>) => {
      this.data = {
        ...res,
        data: this.transformCandidates(res.data),
      };
      if (this.data.data.length == 0) {
        this.importStatus = false;
        this.newStatus = true;
      } else {
        this.importStatus = true;
        this.newStatus = false;
      }
      if (!this.skipAutoSelection) {
        this.updateAlreadySelectedCandidates();
      }
      this.skipAutoSelection = false;
      if (clearLoading) {
        this.isLoading = false;
      } else {
        this.isLoading = false;
      }
    };

    const error = (error: CustomErrorResponse) => {
      this.isLoading = false;
      this.errorMessage(error);
    };
    this.candidateService
      .paginationEntity<CandidateModel>('all', payload)
      .subscribe({ next, error });
  }
  public getSelectedItems(selectedUsersIds: AssessmentViewModel[]): void {
    this.selectedUsers = selectedUsersIds.map((item) => item.id);
    this.updateScheduleButtonState();
  }

  public onTablePayloadChange(payload: PaginatedPayload): void {
    this.loadData(payload);
  }
  public onView(data: CandidateModel) {
    const userid = data.id;
    const assessmentId = this.assessmentId();
    this.router.navigate(
      [`admin/recruitments/candidateDetail/${assessmentId}/${userid}`],
      {
        queryParams: { breadcrumbSource: 'schedule' },
      },
    );
  }

  public handleUnmask(event: { product: CandidateModel; field: string }): void {
    const candidate = event.product;
    this.candidateService.unmaskAadhaar(candidate.id).subscribe({
      next: (res) => {
        candidate.aadhaarNumber = res.aadhaarNumber;
        this.messageService.add({
          severity: 'info',
          summary: 'Aadhaar Unmasked',
          detail: 'Aadhaar number has been retrieved and logged.',
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to unmask Aadhaar number.',
        });
      },
    });
  }

  public viewHistory(data: any) {
    this.currentHistoryCandidateId = data?.id || null;
    this.historyPagination.pageNumber = 1;
    this.historyEvents = [];
    this.visible = true;
    this.fetchCandidateHistory();
  }

  public viewGlobalHistory() {
    this.currentHistoryCandidateId = null;
    this.historyPagination.pageNumber = 1;
    this.historyEvents = [];
    this.visible = true;
    this.fetchCandidateHistory();
  }

  public loadMoreHistory() {
    this.historyPagination.pageNumber++;
    this.fetchCandidateHistory();
  }

  private fetchCandidateHistory() {
    this.historyLoading = true;
    const payload = new PaginatedPayload();
    payload.pagination.pageNumber = this.historyPagination.pageNumber;
    payload.pagination.pageSize = this.historyPagination.pageSize;
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
    };

    if (this.currentHistoryCandidateId) {
      payload.filterMap['candidateId'] = this.currentHistoryCandidateId;
    }

    payload.multiSortedColumns = [{ active: 'ChangedAt', direction: 'desc' }];

    this.candidateService.getCandidateHistoryPaginated(payload)
      .pipe(finalize(() => this.historyLoading = false))
      .subscribe({
        next: (res: any) => {
          const newEvents = res.data.map((item: any) => ({
            status: item.action?.toLowerCase() === 'rescheduled' ? 'Scheduled' : item.action,
            user: item.changedByName,
            date: new Date(item.changedAt + 'Z'),
            icon: this.getHistoryIcon(item.action),
            description: this.getHistoryDescription(item)
          }));
          this.historyEvents = [...this.historyEvents, ...newEvents];
          this.historyPagination.totalRecords = res.totalRecords;
        },
        error: (err: any) => {
          this.errorMessage(err);
        }
      });
  }

  private getHistoryDescription(item: any): string {
    if (item.details) {
      return item.details;
    }
    if (item.field) {
      const formatVal = (v: any) => v === '' || v === null || v === undefined ? 'null' : v;
      return `${item.field}: ${formatVal(item.previousValue)} → ${formatVal(item.currentValue)}`;
    }
    return 'Candidate was modified';
  }

  private getHistoryIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'created':
      case 'imported':
        return 'pi pi-plus';
      case 'updated':
        return 'pi pi-pencil';
      case 'deleted':
        return 'pi pi-trash';
      case 'assigned':
      case 'reassigned':
        return 'pi pi-link';
      case 'scheduled':
      case 'rescheduled':
        return 'pi pi-calendar-clock';
      default:
        return 'pi pi-info-circle';
    }
  }

  public onPreviousAssessment(data: CandidateModel) {
    const userid = data.id;
    const assessmentId = this.assessmentId();
    this.router.navigate([
      `admin/recruitments/previous-recruitments/${assessmentId}/${userid}`,
    ]);
  }
  public onImport(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    this.isLoading = true;
    this.isUploading = true;
    this.importCandidates(file);
  }
  public importCandidates(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const parsed = parseCsvToJson(text);
          const namePattern = /^[A-Za-z]+([ .][A-Za-z]+)*[ .]?$/;
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          const phonePattern = /^\+?[0-9]{10,12}$/;
          const validationIssues: string[] = [];

          parsed.forEach((row, idx) => {
            const lineNum = idx + 2; // Line 1 is headers
            const rawName = row['Candidate Name'] || row['name'] || row['Full Name'] || row['Fullname'] || '';
            const name = rawName.trim();
            const email = (row['Email Id'] || row['Email address'] || row['email'] || row['Email ID'] || row['emailId'] || '').trim();
            const phone = (row['Mobile number'] || row['phoneNumber'] || row['phone'] || row['Mobile Number'] || row['Contact Number'] || '').trim().replace(/\s/g, '');
            const dob = (row['Date of Birth'] || row['dob'] || row['Date Of Birth'] || row['dateOfBirth'] || row['DOB'] || '').trim();
            const gender = (row['Gender'] || row['gender'] || '').trim().toLowerCase();

            const displayName = name || `Candidate on Line ${lineNum}`;
            const errors: string[] = [];

            // 1. Name validation
            if (!name) {
              errors.push('Name is required');
            } else if (name.length < 3) {
              errors.push('Name must be at least 3 characters');
            } else if (!namePattern.test(name)) {
              errors.push('Name cannot contain numbers or special characters');
            }

            // 2. Email validation
            if (!email) {
              errors.push('Email address is required');
            } else if (!emailPattern.test(email)) {
              errors.push('Invalid email address format');
            }

            // 3. Phone validation
            if (!phone) {
              errors.push('Phone number is required');
            } else if (!phonePattern.test(phone)) {
              errors.push('Phone number must be 10-12 digits');
            }

            // 4. DOB validation
            if (!dob) {
              errors.push('Date of Birth is required');
            } else {
              const dobDate = new Date(dob);
              if (isNaN(dobDate.getTime())) {
                errors.push('Invalid Date of Birth format (use YYYY-MM-DD or MM/DD/YYYY)');
              } else {
                const today = new Date();
                let age = today.getFullYear() - dobDate.getFullYear();
                const m = today.getMonth() - dobDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                  age--;
                }
                if (age < 18) {
                  errors.push('Candidate must be at least 18 years old');
                }
              }
            }

            // 5. Gender validation
            if (!gender) {
              errors.push('Gender is required');
            } else if (!['male', 'female', 'other'].includes(gender)) {
              errors.push('Gender must be Male, Female, or Other');
            }

            if (errors.length > 0) {
              validationIssues.push(`${displayName} (Line ${lineNum}): ${errors.join(', ')}`);
            }
          });

          if (validationIssues.length > 0) {
            const modalData: DialogData = {
              title: 'Validation Error',
              message: 'The following CSV records contain invalid fields. Please correct the CSV file and reupload it.',
              candidateNames: validationIssues,
              isChoice: false,
              acceptButtonText: 'OK'
            };
            this.ref = this.dialog.open(DialogComponent, {
              data: modalData,
              header: 'Import Validation Failed',
              maximizable: false,
              width: '50vw',
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
            this.isUploading = false;
            this.isLoading = false;
            return;
          }
        } catch (err) {
          console.error('Error parsing CSV during validation:', err);
        }
      }

      this.uploadFile(file);
    };
    reader.onerror = () => {
      this.uploadFile(file);
    };
    reader.readAsText(file);
  }

  private uploadFile(file: File) {
    this.assessmentService
      .uploadFileAndReturnData<CandidateImportResponseDto>(
        file,
        `candidates/import?asessmentId=${this.assessmentId()}`,
      )
      .subscribe({
        next: (response: CandidateImportResponseDto) => {
          let allFailedRecords: unknown[] = [];

          // 1. Handle Duplicates
          if (response.duplicateEntries) {
            try {
              let parsedDuplicates: any[] = [];
              const rawDuplicates = response.duplicateEntries;

              if (
                typeof rawDuplicates === 'string' &&
                rawDuplicates !== 'undefined' &&
                rawDuplicates !== 'null'
              ) {
                // Check if it's Base64 or raw CSV
                let csvString = '';
                try {
                  // If it looks like Base64 (starts with common CSV header chars in B64 or doesn't have commas)
                  if (
                    !rawDuplicates.includes(',') &&
                    !rawDuplicates.includes('\n')
                  ) {
                    csvString = atob(rawDuplicates);
                  } else {
                    csvString = rawDuplicates; // Raw CSV string
                  }
                } catch {
                  csvString = rawDuplicates; // Fallback to raw string
                }
                parsedDuplicates = parseCsvToJson(csvString);
              } else if (Array.isArray(rawDuplicates)) {
                // Normalize duplicates from array format to include display labels
                parsedDuplicates = rawDuplicates.map((d: any) => {
                  const dynamicAnswers =
                    typeof d.dynamicAnswers === 'string'
                      ? {}
                      : d.dynamicAnswers || {};
                  const name =
                    d.name || dynamicAnswers['Candidate Name'] || 'N/A';
                  const email = d.email || dynamicAnswers['Email Id'] || 'N/A';
                  const phone =
                    d.phoneNumber || dynamicAnswers['Mobile number'] || 'N/A';
                  const aadhaar =
                    d.aadhaarNumber ||
                    dynamicAnswers['Aadhaar Number'] ||
                    'N/A';

                  return {
                    ...d,
                    ...dynamicAnswers,
                    isDuplicateRecord: true,
                    'Candidate Name': name,
                    'Email Id': email,
                    'Mobile number': phone,
                    'Aadhaar Number': aadhaar,
                    name,
                    email,
                    phoneNumber: phone,
                    aadhaarNumber: aadhaar,
                  };
                });
              }

              if (parsedDuplicates.length > 0) {
                const groupedDuplicates =
                  groupCandidatesByContact(parsedDuplicates);
                const taggedDuplicates = groupedDuplicates.map((g) => ({
                  ...g,
                  isDuplicateGroup: true,
                  type: 'Duplicate',
                }));
                allFailedRecords = [...allFailedRecords, ...taggedDuplicates];
              }
            } catch (e) {
              console.error('Error processing duplicate entries:', e);
            }
          }

          // 2. Handle Invalid Records (Rectification Screen)
          if (
            response.invalidRecords &&
            Array.isArray(response.invalidRecords) &&
            response.invalidRecords.length > 0
          ) {
            const mappedInvalid = response.invalidRecords.map((record) => {
              const rowData =
                typeof record.dynamicAnswers === 'string'
                  ? {}
                  : record.dynamicAnswers || {};
              // Ensure we have common fields even if misspelled in CSV or at root of record
              const name =
                record.name ||
                rowData['Candidate Name'] ||
                rowData['name'] ||
                'N/A';
              const email =
                record.email ||
                rowData['Email Id'] ||
                rowData['Email address'] ||
                rowData['email'] ||
                'N/A';
              const phone =
                record.phoneNumber ||
                rowData['Mobile number'] ||
                rowData['phoneNumber'] ||
                rowData['phone'] ||
                'N/A';
              const aadhaarNumber =
                record.aadhaarNumber ||
                rowData['Aadhaar Number'] ||
                rowData['Adhar Number'] ||
                rowData['aadhaarNumber'] ||
                'N/A';

              const normalizedData = {
                ...rowData,
                name,
                email,
                phoneNumber: phone,
                aadhaarNumber,
                // Also keep CSV header names for display if needed
                'Candidate Name': name,
                'Email Id': email,
                'Mobile number': phone,
                'Aadhaar Number': aadhaarNumber,
                isInvalidRecord: true,
                failureReason: record.reason,
              };

              return {
                ...normalizedData,
                key: record.reason || 'Invalid Format',
                groupId:
                  'invalid-' + Math.random().toString(36).substring(2, 9),
                isInvalidGroup: true,
                type: 'Invalid',
                candidates: [
                  {
                    ...normalizedData,
                  },
                ],
              };
            });
            allFailedRecords = [...allFailedRecords, ...mappedInvalid];
          }

          // 3. Handle Non-Eligible Records
          if (
            response.nonEligibleCandidateList &&
            Array.isArray(response.nonEligibleCandidateList) &&
            response.nonEligibleCandidateList.length > 0
          ) {
            const mappedNonEligible = response.nonEligibleCandidateList.map((record) => {
              const rowData =
                typeof record.dynamicAnswers === 'string'
                  ? {}
                  : record.dynamicAnswers || {};
              // Ensure we have common fields even if misspelled in CSV or at root of record
              const name =
                record.name ||
                rowData['Candidate Name'] ||
                rowData['name'] ||
                'N/A';
              const email =
                record.email ||
                rowData['Email Id'] ||
                rowData['Email address'] ||
                rowData['email'] ||
                'N/A';
              const phone =
                record.phoneNumber ||
                rowData['Mobile number'] ||
                rowData['phoneNumber'] ||
                rowData['phone'] ||
                'N/A';
              const aadhaarNumber =
                record.aadhaarNumber ||
                rowData['Aadhaar Number'] ||
                rowData['Adhar Number'] ||
                rowData['aadhaarNumber'] ||
                'N/A';

              const normalizedData = {
                ...rowData,
                name,
                email,
                phoneNumber: phone,
                aadhaarNumber,
                // Also keep CSV header names for display if needed
                'Candidate Name': name,
                'Email Id': email,
                'Mobile number': phone,
                'Aadhaar Number': aadhaarNumber,
                isNonEligibleRecord: true,
                failureReason: record.reason,
              };

              return {
                ...normalizedData,
                key: record.reason || 'Not Eligible',
                groupId:
                  'noneligible-' + Math.random().toString(36).substring(2, 9),
                isNonEligibleGroup: true,
                type: 'NonEligible',
                candidates: [
                  {
                    ...normalizedData,
                  },
                ],
              };
            });
            allFailedRecords = [...allFailedRecords, ...mappedNonEligible];
          }

          if (allFailedRecords.length > 0) {
            this.manageDuplicateRecords(allFailedRecords);
          } else {
            this.getAllCandidates(new PaginatedPayload(), true);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Processing complete.`,
            });
          }

          this.getAllCandidatesApplicationQuestions();
          this.isUploading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage(err);
          this.isUploading = false;
        },
      });
  }
  public addNewCandidate() {
    this.ref = this.dialog.open(CandidateDialogComponent, {
      data: {
        questionSets: this.questionSets,
        applicationQuestions: this.candidateApplicationQuestions,
        candidateData: this.data,
      },
      header: 'Create Candidate',
      maximizable: false,
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.ref.onClose.subscribe((result) => {
      if (result) {
        result.assessmentId = this.assessmentId();
        this.isLoading = true;
        const next = (res: any) => {
          this.isLoading = false;
          if (res && typeof res === 'object' && res.name) {
            const isNameMismatch = res.name?.trim().toLowerCase() !== result.name?.trim().toLowerCase();
            const isEmailMismatch = res.email?.trim().toLowerCase() !== result.email?.trim().toLowerCase();
            const isPhoneMismatch = (res.phoneNumber || '').trim() !== (result.phoneNumber || '').trim();
            const isGenderMismatch = (res.gender || '').trim().toLowerCase() !== (result.gender || '').trim().toLowerCase();
            const isDobMismatch = res.dob !== result.dob;

            const modalData: DialogData = {
              message: `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 0; white-space: normal;">
                  <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
                    A candidate with Aadhaar Number <strong style="color: #0f172a; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${res.aadhaarNumber}</strong> is already registered. The details you entered differ from the existing record:
                  </p>

                  <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; text-align: left;">
                      <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569;">
                          <th style="padding: 12px 16px; font-weight: 600;">Field</th>
                          <th style="padding: 12px 16px; font-weight: 600; color: #2563eb;">Registered (Existing)</th>
                          <th style="padding: 12px 16px; font-weight: 600; color: #d97706;">Entered (New)</th>
                        </tr>
                      </thead>
                      <tbody style="color: #334155;">
                        <tr style="border-bottom: 1px solid #f1f5f9; ${isNameMismatch ? 'background-color: #fffbeb;' : ''}">
                          <td style="padding: 12px 16px; font-weight: 500; color: #64748b;">
                            Name ${isNameMismatch ? '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Diff</span>' : ''}
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${res.name}</td>
                          <td style="padding: 12px 16px; color: ${isNameMismatch ? '#b45309' : '#94a3b8'};">${result.name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9; ${isEmailMismatch ? 'background-color: #fffbeb;' : ''}">
                          <td style="padding: 12px 16px; font-weight: 500; color: #64748b;">
                            Email ${isEmailMismatch ? '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Diff</span>' : ''}
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600; color: #0f172a; word-break: break-all;">${res.email}</td>
                          <td style="padding: 12px 16px; color: ${isEmailMismatch ? '#b45309' : '#94a3b8'}; word-break: break-all;">${result.email}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9; ${isPhoneMismatch ? 'background-color: #fffbeb;' : ''}">
                          <td style="padding: 12px 16px; font-weight: 500; color: #64748b;">
                            Phone ${isPhoneMismatch ? '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Diff</span>' : ''}
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${res.phoneNumber || 'N/A'}</td>
                          <td style="padding: 12px 16px; color: ${isPhoneMismatch ? '#b45309' : '#94a3b8'};">${result.phoneNumber || 'N/A'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9; ${isGenderMismatch ? 'background-color: #fffbeb;' : ''}">
                          <td style="padding: 12px 16px; font-weight: 500; color: #64748b;">
                            Gender ${isGenderMismatch ? '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Diff</span>' : ''}
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${res.gender || 'N/A'}</td>
                          <td style="padding: 12px 16px; color: ${isGenderMismatch ? '#b45309' : '#94a3b8'};">${result.gender || 'N/A'}</td>
                        </tr>
                        <tr style="${isDobMismatch ? 'background-color: #fffbeb;' : ''}">
                          <td style="padding: 12px 16px; font-weight: 500; color: #64748b;">
                            DOB ${isDobMismatch ? '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 8px;">Diff</span>' : ''}
                          </td>
                          <td style="padding: 12px 16px; font-weight: 600; color: #0f172a;">${res.dob || 'N/A'}</td>
                          <td style="padding: 12px 16px; color: ${isDobMismatch ? '#b45309' : '#94a3b8'};">${result.dob || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p style="font-size: 14.5px; font-weight: 500; color: #1e293b; margin-top: 20px; line-height: 1.6;">
                    Do you want to <strong style="color: #2563eb;">Restore</strong> and use the registered details, or <strong style="color: #64748b;">Cancel</strong> this candidate's addition?
                  </p>
                </div>
              `.trim(),
              isChoice: true,
              isHtml: true,
              cancelButtonText: 'Cancel',
              acceptButtonText: 'Restore',
            };
            this.ref = this.dialog.open(DialogComponent, {
              data: modalData,
              header: 'Details Mismatch Warning',
              maximizable: false,
              width: '50vw',
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
            this.ref.onClose.subscribe((accept) => {
              if (accept) {
                this.isLoading = true;
                result.bypassMismatchCheck = true;
                this.candidateService.createEntity(result).subscribe({
                  next: () => {
                    this.isLoading = false;
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Success',
                      detail: 'Candidate added with existing Aadhaar details.',
                    });
                    this.getAllCandidates(new PaginatedPayload());
                  },
                  error: (err) => {
                    this.isLoading = false;
                    this.errorMessage(err);
                  }
                });
              } else {
                this.messageService.add({
                  severity: 'info',
                  summary: 'Cancelled',
                  detail: 'Candidate association cancelled.',
                });
              }
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Created the Candidate Successfully',
            });
            this.getAllCandidates(new PaginatedPayload());
          }
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          this.errorMessage(error);
        };
        this.candidateService.createEntity(result).subscribe({ next, error });
      }
    });
  }
  public deleteSelectedCandidates() {
    const payload = {
      candidateIds: this.selectedUsers,
      assessmentId: this.assessmentId(),
    };
    const modalData: DialogData = {
      message: `Are you sure you want to delete the selected candidate${this.selectedUsers.length > 1 ? 's' : ''}?`,
      isChoice: true,
      cancelButtonText: 'Cancel',
      acceptButtonText: 'Delete',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning',
      maximizable: false,
      width: '50vw',
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
      if (result) {
        this.isLoading = true;
        const next = () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted the Selected Candidates Successfully',
          });
          this.tableComponent?.clearAllSelections();
          this.getAllCandidates(new PaginatedPayload(), true);
        };
        const error = (error: CustomErrorResponse) => {
          this.isLoading = false;
          this.errorMessage(error);
        };
        this.candidateService
          .updateEntity('', payload, 'remove')
          .subscribe({ next, error });
      }
    });
  }
  public scheduleAssessment(): void {
    if (this.selectedUsers) {
      const payload = {
        candidateIds: this.selectedUsers,
        assessmentId: this.assessmentId(),
      };
      const modalData: DialogData = {
        message: 'Are you sure you want to schedule the recruitment?',
        isChoice: true,
        cancelButtonText: 'Cancel',
        acceptButtonText: 'Yes',
      };
      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        header: 'Warning',
        maximizable: false,
        width: '50vw',
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
        if (result) {
          this.isLoading = true;
          this.assessmentService.createEntity(payload, 'schedule').subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Scheduled the Recruitment Successfully',
              });
              this.alreadySelectedCandidates = [];
              this.selectedUsers = [];
              this.getAllCandidates(new PaginatedPayload(), true);
              this.checkStepStatusAndMoveNext();
            },
            error: (error: CustomErrorResponse) => {
              this.isLoading = false;
              this.errorMessage(error);
            },
          });
        }
      });
    }
  }
  private manageDuplicateRecords(duplicateRecords: unknown[]): void {
    this.ref = this.dialog.open(ManageDuplicateRecordsComponent, {
      data: {
        duplicateRecords,
        assessmentId: this.assessmentId(),
        applicationQuestions: this.candidateApplicationQuestions,
      },
      header: 'Resolve Candidate Import Exceptions',
      maximizable: true,
      width: '50vw',
      closable: false,
      modal: true,
      focusOnShow: false,
      styleClass: 'manage-duplicate-records-dialog',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });
    this.dialog.getInstance(this.ref)?.maximize();
    this.ref.onClose.subscribe((result) => {
      if (result?.refresh) {
        this.getAllCandidates(new PaginatedPayload(), true);
        // Refresh application questions after resolving duplicates to get newly added columns
        this.getAllCandidatesApplicationQuestions();
      } else {
        this.isLoading = false;
      }
    });
  }
  private loadData(payload: PaginatedPayload): void {
    this.isLoading = true;
    payload.filterMap = {
      ...payload.filterMap,
      assessmentId: Number(this.assessmentId()),
    };
    this.dataSourceService
      .getData(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((response: PaginatedData<CandidateModel>) => {
        this.data = {
          ...response,
          data: this.transformCandidates(response.data),
        };
        this.alreadySelectedCandidates = [...(this.selectedUsers as string[])];
      });
  }

  private transformCandidates(candidates: CandidateModel[]): CandidateModel[] {
    return candidates.map((candidate) => {
      const visibleButtonIndices = [0, 1, 2, 3];
      const disabledButtonIndices: number[] = [];

      if (this.isReadOnly()) {
        disabledButtonIndices.push(1); // Delete
      }
      const hasPrevious = !!candidate.isAlreadyExist || (candidate.previousRecruitmentIds && candidate.previousRecruitmentIds.length > 0);
      if (!hasPrevious) {
        disabledButtonIndices.push(3);
      }

      const status = (candidate as any).status?.toLowerCase();
      const isEnrolledOrActive = status === 'scheduled' || 
                                 status === 'assigned' || 
                                 status === 'selected' || 
                                 status === 'completed' || 
                                 status === 'rejected' || 
                                 status === 'enrolled' || 
                                 status === 'active' || 
                                 (candidate.batchId && candidate.batchId > 0);

      if (isEnrolledOrActive) {
        if (!disabledButtonIndices.includes(1)) {
          disabledButtonIndices.push(1); // Delete button
        }
      }

      return {
        ...candidate,
        currentLocation: candidate.currentLocation || 'N/A',
        visibleButtonIndices,
        disabledButtonIndices,
        isDisabled: isEnrolledOrActive ? true : undefined
      };
    });
  }
  private getAllCandidatesApplicationQuestions() {
    const next = (res: CandidateApplicationQuestions[]) => {
      this.candidateApplicationQuestions = res;
    };

    const error = (error: CustomErrorResponse) => {
      this.errorMessage(error);
    };

    this.candidateService
      .getEntityById(Number(this.assessmentId()))
      .subscribe({ next, error });
  }
  private getAllQuestionSets(payload: PaginatedPayload): void {
    payload.filterMap = {
      assessmentId: Number(this.assessmentId()),
      activeSet: '',
    };
    payload.pagination.pageSize = -1;

    const next = (res: any) => {
      this.questionSets = res.data;
      this.questionSetStateService.setQuestionSets(this.questionSets);
    };

    const error = (error: CustomErrorResponse) => {
      this.errorMessage(error);
    };

    this.assessmentService
      .paginationEntity('QuestionSetSummary', payload)
      .subscribe({ next, error });
  }
  private setPaginationEndpoint() {
    this.dataSourceService.setEndpoint(`${this.url}`);
  }


  private errorMessage(error: CustomErrorResponse): void {
    const errorBody = error?.error;
    const type = errorBody?.type;

    let displayMessage = 'Contact Technical Support';

    if (type) {
      displayMessage = `${type}`;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: displayMessage,
    });
  }

  // private updateAlreadySelectedCandidates(): void {
  //   if (!this.data || !this.data.data) {
  //     this.alreadySelectedCandidates = [];
  //     return;
  //   }

  //   this.alreadySelectedCandidates = this.data.data
  //     .filter(
  //       (candidate: CandidateModel) =>
  //         candidate.batchId !== null &&
  //         candidate.batchId !== undefined &&
  //         candidate.batchId > 0,
  //     )
  //     .map((candidate: CandidateModel) => candidate.id);
  // }
  private updateAlreadySelectedCandidates(): void {
    this.alreadySelectedCandidates = [];
    this.selectedUsers = [];
    this.updateScheduleButtonState();
  }

  private checkStepStatusAndMoveNext(): void {
    const assessmentId = Number(this.assessmentId());
    if (assessmentId) {
      this.stepsStatusService.getAssessmentStepsStatus(assessmentId).subscribe({
        next: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
        error: () => {
          this.stepsStatusService.notifyStepCompleted(assessmentId);
        },
      });
    }
  }

  private updateScheduleButtonState(): void {
    if (!this.selectedUsers?.length || !this.data?.data) {
      this.disableScheduleButton = true;
      this.disableDeleteSelectedButton = true;
      this.tooltipMessage = '';
      return;
    }

    const hasScheduledCandidate = this.selectedUsers.some(userId => {
      const candidate = this.data.data.find(c => c.id === userId);
      if (!candidate) return false;
      
      const status = (candidate as any).status?.toLowerCase();
      return status === 'scheduled' || 
             status === 'assigned' || 
             status === 'selected' || 
             status === 'completed' || 
             status === 'rejected' || 
             status === 'enrolled' || 
             status === 'active' || 
             (candidate.batchId && candidate.batchId > 0);
    });

    this.disableScheduleButton = hasScheduledCandidate;
    this.disableDeleteSelectedButton = hasScheduledCandidate;
    this.tooltipMessage = hasScheduledCandidate ? 'Action disabled for candidates already in the recruitment cycle.' : '';
  }
}
