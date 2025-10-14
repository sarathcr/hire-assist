/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogFooterComponent } from '../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { StatusEnum } from '../../shared/enums/status.enum';
import { DialogData } from '../../shared/models/dialog.models';
import { CardComponent } from './components/card/card.component';
import { CandidateAssessment } from './models/candidate.model';
import { CandidateService } from './services/candidate.service';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent, DatePipe],
  templateUrl: './candidate.component.html',
  styleUrl: './candidate.component.scss',
})
export class CandidateComponent extends BaseComponent implements OnInit {
  public activeAssessments: CandidateAssessment[] = [];
  public previousAssessments: CandidateAssessment[] = [];
  private ref: DynamicDialogRef | undefined;
  public statusEnum = StatusEnum;

  constructor(
    public dialog: DialogService,
    private router: Router,
    private candidateService: CandidateService,
  ) {
    super();
  }

  // LifeCycle Hooks
  ngOnInit(): void {
    this.candidateService.getCandidateAssessment().subscribe({
      next: (res: CandidateAssessment[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to 00:00:00.000

        this.activeAssessments = res.filter((a) => {
          const assessmentDate = new Date(a.date);
          assessmentDate.setHours(0, 0, 0, 0);
          return assessmentDate >= today;
        });

        this.previousAssessments = res.filter((a) => {
          const assessmentDate = new Date(a.date);
          assessmentDate.setHours(0, 0, 0, 0);
          return assessmentDate < today;
        });
      },
    });
  }

  // Public Methods
  public onAssessmentStart(assessment: CandidateAssessment) {
    const modalData: DialogData = {
      message:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
      isChoice: true,
      acceptButtonText: 'Start Assessment',
      cancelButtonText: 'Cancel',
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Assessment instructions',
      maximizable: true,
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
        this.router.navigate(['/candidate/test'], {
          state: { assessment: assessment },
        });
      }
    });
  }
}
