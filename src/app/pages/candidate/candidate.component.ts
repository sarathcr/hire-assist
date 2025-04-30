/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { CardComponent } from './components/card/card.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CandidateAssessment } from './models/candidate.model';
import { Router } from '@angular/router';
import { CandidateService } from './services/candidate.service';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogData } from '../../shared/models/dialog.models';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../shared/components/dialog-footer/dialog-footer.component';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent],
  templateUrl: './candidate.component.html',
  styleUrl: './candidate.component.scss',
})
export class CandidateComponent extends BaseComponent implements OnInit {
  public data: CandidateAssessment[] = [];

  private ref: DynamicDialogRef | undefined;

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
        this.data = res;
      },
      error: (error: any) => {
        console.error('Error fetching assessments:', error);
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
        console.log('Assessment instructions', assessment);
        this.router.navigate(['/candidate/test'], {
          state: { assessment: assessment },
        });
      }
    });
  }
}
