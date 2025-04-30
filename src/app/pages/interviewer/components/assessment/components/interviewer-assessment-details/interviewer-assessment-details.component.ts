import { Component, OnInit } from '@angular/core';
import { TableComponent } from '../../../../../../shared/components/table/table.component';
import {
  FieldType,
  // FieldType,
  // PaginatedDataActions,
  TableColumnsData,
} from '../../../../../../shared/models/table.models';
import { CustomErrorResponse } from '../../../../../../shared/models/custom-error.models';
import { InterviewService } from '../../../../../admin/components/assessment/services/interview.service';
import { ActivatedRoute, Router } from '@angular/router';
const datas = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@gmail.com',
    score: 30,
    status: 'Scheduled',
    actions: 'Schedule Interview',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'smith@gmail.com',
    score: 30,
    status: 'Pending',
    actions: 'Schedule Interview',
  },
];
const tableColumns: TableColumnsData = {
  columns: [
    {
      field: 'name',
      displayName: 'Name',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
    {
      field: 'email',
      displayName: 'Email',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
    {
      field: 'score',
      displayName: 'Score',
      sortedColumn: true,
      hasChip: false,
      hasFilter: true,
    },
    {
      field: 'status',
      displayName: 'Status',
      sortedColumn: true,
      hasChip: false,
      hasFilter: false,
    },
    {
      field: 'button',
      displayName: 'Actions',
      fieldType: FieldType.Button,
      //actions: 'Schedule Interview',
      buttonLabel: 'Start Interview',
      sortedColumn: false,
      hasChip: false,
      hasFilter: false,
    },
  ],
  displayedColumns: ['registeredName', 'actions'],
};

@Component({
  selector: 'app-interviewer-assessmen-details',
  imports: [TableComponent],
  templateUrl: './interviewer-assessment-details.component.html',
  styleUrl: './interviewer-assessment-details.component.scss',
})
export class InterviewerAssessmentDetailsComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;
  public columns: TableColumnsData = tableColumns;
  private assessmentId!: number;
  constructor(
    private interviewService: InterviewService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    //super();
  }
  private path: string | undefined;
  ngOnInit(): void {
    this.path = this.router.url;
    this.getCurrentTouteId();
    this.getPaginatedCandidateData(datas);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public onButtonClick(data: any): void {
    console.log('Button clicked===', data);
    this.router.navigate([
      `interviewer/assessment/${this.assessmentId}/${data.email}`,
    ]);
  }

  private getCurrentTouteId(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.assessmentId = Number(id);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getPaginatedCandidateData(data: any) {
    const payload = {
      multiSortedColumns: [],
      filterMap: data.payload || {},
      pagination: {
        pageNumber: 1,
        pageSize: 5,
      },
    };
    this.interviewService
      .paginationEntity('/InterviewSummary', payload)
      .subscribe({
        next: (res) => {
          this.data = res;
          console.log('data==>', this.data);
        },
        error: (error: CustomErrorResponse) => {
          console.log('==>', error);
        },
      });
  }
}
