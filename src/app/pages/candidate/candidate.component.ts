/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogFooterComponent } from '../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { StatusEnum } from '../../shared/enums/status.enum';
import { DialogData } from '../../shared/models/dialog.models';
import { CardComponent } from './components/card/card.component';
import { CardSkeletonComponent } from './components/card/card-skeleton.component';
import { CandidateAssessment } from './models/candidate.model';
import { CandidateService } from './services/candidate.service';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent, CardSkeletonComponent, DatePipe],
  templateUrl: './candidate.component.html',
  styleUrl: './candidate.component.scss',
})
export class CandidateComponent extends BaseComponent implements OnInit {
  public activeAssessments: CandidateAssessment[] = [];
  public previousAssessments: CandidateAssessment[] = [];
  private ref: DynamicDialogRef | undefined;
  public statusEnum = StatusEnum;
  public isLoading = true;
  public skeletonCards = [1, 2, 3]; // For rendering skeleton cards

  constructor(
    public dialog: DialogService,
    private router: Router,
    private route: ActivatedRoute,
    private candidateService: CandidateService,
  ) {
    super();
  }

  // LifeCycle Hooks
  // LifeCycle Hooks
  ngOnInit(): void {
    // Listen to query params for changes
    this.subscriptionList.push(
      this.route.queryParams
        .pipe(
          debounceTime(50),
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
          ),
        )
        .subscribe((params) => {
          if (params['refresh'] === 'true') {
            // If refresh is true, clear the param. The subsequent emission with empty params will trigger the load.
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true,
            });
          } else {
            // Only load assessments when refresh param is NOT present
            this.loadAssessments();
          }
        })
    );
  }

  // Private Methods
  private loadAssessments(): void {
    this.isLoading = true;
    this.candidateService.getCandidateAssessment().subscribe({
      next: (res: CandidateAssessment[]) => {
        const today = new Date();

        this.activeAssessments = res.filter((a) => {
          // Use endTime if available, otherwise fall back to date (though date might be null per issue description)
          // The issue states date is null, so rely on endTime
          const comparisonDate = a.endTime ? new Date(a.endTime) : (a.date ? new Date(a.date) : null);
          
          if (!comparisonDate) return false; // If neither exists, can't determine, maybe assume not active?
          
          return comparisonDate >= today;
        });

        this.previousAssessments = res.filter((a) => {
          const comparisonDate = a.endTime ? new Date(a.endTime) : (a.date ? new Date(a.date) : null);
          
          if (!comparisonDate) return true; // If data invalid, maybe show in previous as safeguard?
          
          return comparisonDate < today;
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
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
