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
import { DeviceWarningService } from '../../shared/services/device-width.service';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent, CardSkeletonComponent],
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
    private deviceWarningService: DeviceWarningService,
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
        }),
    );
  }

  // Private Methods
  private loadAssessments(): void {
    this.isLoading = true;
    this.candidateService.getCandidateAssessment().subscribe({
      next: (res: CandidateAssessment[]) => {
        const today = new Date();

        this.activeAssessments = res.filter((a) => {
          const isFinished =
            a.statusId === StatusEnum.Completed ||
            a.statusId === StatusEnum.Quit ||
            a.statusId === StatusEnum.Selected;

          if (isFinished) return false;

          const comparisonDate = a.endTime
            ? new Date(a.endTime)
            : a.date
              ? new Date(a.date)
              : null;

          if (!comparisonDate) return false;

          return comparisonDate >= today;
        });

        this.previousAssessments = res.filter((a) => {
          const isFinished =
            a.statusId === StatusEnum.Completed ||
            a.statusId === StatusEnum.Quit ||
            a.statusId === StatusEnum.Selected;

          if (isFinished) return true;

          const comparisonDate = a.endTime
            ? new Date(a.endTime)
            : a.date
              ? new Date(a.date)
              : null;

          if (!comparisonDate) return true;

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
    this.deviceWarningService.checkDeviceWidth().subscribe((canProceed) => {
      if (canProceed) {
        const modalData: DialogData = {
          message: `
            <div class="assessment-instructions">
              <p>Please read the following instructions carefully before starting the assessment:</p>
              <ul>
                <li><strong>Full-Screen Mode:</strong> Upon starting, the assessment will enter full-screen mode. You must remain in this mode throughout the session.</li>
                <li><strong>Proctoring Rules:</strong> Exiting full-screen mode or switching to other browser tabs or applications will <strong>immediately terminate</strong> your assessment.</li>
                <li><strong>Locked Assessment:</strong> If your session is terminated unintentionally due to technical issues, please contact the HR manager to unlock it.</li>
                <li><strong>Navigation:</strong>
                  <ul>
                    <li>Select an answer and click <strong>'Next'</strong> to move forward.</li>
                    <li>Use <strong>'Mark for Review'</strong> if you are unsure and want to revisit the question later.</li>
                    <li>Click <strong>'Skip'</strong> if you wish to bypass a question.</li>
                  </ul>
                </li>
                <li><strong>Flexibility:</strong> You can return to any question and update your answers at any time until the timer expires.</li>
                <li><strong>Auto-Submission:</strong> Once the timer runs out, all your attempted answers will be automatically saved and submitted.</li>
                <li><strong>Assistance:</strong> For any confusion or technical issues, please contact the volunteers present in the room.</li>
              </ul>
            </div>
          `,
          isChoice: true,
          isHtml: true,
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
    });
  }

  public getScheduledDate(assessment: CandidateAssessment): string {
    const assessmentDate = new Date(assessment.date ?? '');
    const startTimeStr = assessment.startTime ?? '';
    const endTimeStr = assessment.endTime ?? '';

    let startDateTime = new Date(startTimeStr);
    let endDateTime = new Date(endTimeStr);

    if (isNaN(startDateTime.getTime())) {
      startDateTime = this.combineDateAndTime(assessmentDate, startTimeStr);
    }

    if (isNaN(endDateTime.getTime())) {
      endDateTime = this.combineDateAndTime(assessmentDate, endTimeStr);
    }

    const datePipe = new DatePipe('en-US');
    const startFormat = datePipe.transform(startDateTime, 'dd/MM/yyyy hh:mm a');
    const endFormat = datePipe.transform(endDateTime, 'dd/MM/yyyy hh:mm a');

    return `${startFormat} - ${endFormat}`;
  }

  private combineDateAndTime(date: Date, timeStr: string): Date {
    const combined = new Date(date);

    if (!timeStr) {
      return combined;
    }

    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

      if (!isNaN(hours) && !isNaN(minutes)) {
        combined.setHours(hours);
        combined.setMinutes(minutes);
        combined.setSeconds(seconds);
        combined.setMilliseconds(0);
      }
    }

    return combined;
  }
}
