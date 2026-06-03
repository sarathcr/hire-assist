import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'primeng/basecomponent';
import { SkeletonComponent } from '../../../../shared/components/assessment-card/assessment-card-skeleton';
import { CustomErrorResponse } from '../../../../shared/models/custom-error.models';
import { FrontDeskAssessmentRound } from '../../../admin/models/assessment.model';
import { AssessmentService } from '../../../admin/services/assessment.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state/empty-state.component';

@Component({
  selector: 'app-frontdesk-assessment-rounds',
  imports: [SkeletonComponent, CommonModule, EmptyStateComponent],
  templateUrl: './frontdesk-assessment-rounds.component.html',
  styleUrl: './frontdesk-assessment-rounds.component.scss',
})
export class FrontdeskAssessmentRoundsComponent
  extends BaseComponent
  implements OnInit
{
  public assessmentDataSource: FrontDeskAssessmentRound[] = [];
  public assessmentId!: number;
  public isLoading = true;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private messageService: MessageService,
  ) {
    super();
  }
  override ngOnInit(): void {
    this.getAssessmentId();
  }

  public onClickAssessment(id: number): void {
    if (id > 0) {
      this.router.navigate([
        `frontdesk/recruitments/${this.assessmentId}/round/${id}`,
      ]);
    }
  }

  private getAssessmentId() {
    this.route.paramMap.subscribe((params) => {
      this.assessmentId = (params.get('recruitmentId') || params.get('id'))! as unknown as number;
      if (this.assessmentId) {
        this.getAllAssessmentRounds();
      }
    });
  }

  private getAllAssessmentRounds(): void {
    this.isLoading = true;
    this.assessmentDataSource = [];
    const next = (res: FrontDeskAssessmentRound[]) => {
      this.assessmentDataSource = res || [];
      this.isLoading = false;
    };

    const error = (error: CustomErrorResponse) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error.type,
      });
      this.assessmentDataSource = [];
      this.isLoading = false;
    };

    this.assessmentService
      .getAssessmentRoundsForFrontDesk(this.assessmentId)
      .subscribe({ next, error });
  }

  public getBadgeClass(statusId: number, status: string): string {
    const s = (status || '').trim().toLowerCase();
    if (s === 'active' || statusId === 1) return 'round-card__badge--active';
    if (s === 'pending' || statusId === 2) return 'round-card__badge--pending';
    if (s === 'completed' || statusId === 3) return 'round-card__badge--completed';
    return ''; 
  }

  public getFormattedDates(dateString: string): string[] {
    if (!dateString) return [];
    return dateString.split(' - ').map(d => d.trim());
  }
}
