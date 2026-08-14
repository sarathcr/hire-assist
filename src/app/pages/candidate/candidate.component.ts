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
            a.statusId == StatusEnum.Completed ||
            a.statusId == StatusEnum.Quit ||
            a.statusId == StatusEnum.Selected;

          if (isFinished) return false;

          let comparisonDate: Date | null = null;
          if (a.endTime) {
            comparisonDate = this.parseDateSafely(a.endTime);
            if (isNaN(comparisonDate.getTime()) && a.date) {
              comparisonDate = this.combineDateAndTime(this.parseDateSafely(a.date), a.endTime);
            }
          } else if (a.date) {
            comparisonDate = this.parseDateSafely(a.date);
          }

          if (!comparisonDate || isNaN(comparisonDate.getTime())) return false;

          if (a.date) {
            const assessmentDate = this.parseDateSafely(a.date);
            if (!isNaN(assessmentDate.getTime()) && assessmentDate > comparisonDate) {
              comparisonDate = new Date(assessmentDate);
              comparisonDate.setHours(23, 59, 59, 999);
            }
          }

          return comparisonDate >= today;
        });

        this.previousAssessments = res.filter((a) => {
          const isFinished =
            a.statusId == StatusEnum.Completed ||
            a.statusId == StatusEnum.Quit ||
            a.statusId == StatusEnum.Selected;

          if (isFinished) return true;

          let comparisonDate: Date | null = null;
          if (a.endTime) {
            comparisonDate = this.parseDateSafely(a.endTime);
            if (isNaN(comparisonDate.getTime()) && a.date) {
              comparisonDate = this.combineDateAndTime(this.parseDateSafely(a.date), a.endTime);
            }
          } else if (a.date) {
            comparisonDate = this.parseDateSafely(a.date);
          }

          if (!comparisonDate || isNaN(comparisonDate.getTime())) return true;

          if (a.date) {
            const assessmentDate = this.parseDateSafely(a.date);
            if (!isNaN(assessmentDate.getTime()) && assessmentDate > comparisonDate) {
              comparisonDate = new Date(assessmentDate);
              comparisonDate.setHours(23, 59, 59, 999);
            }
          }

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
            <div class="instruction-modal">
              <div class="instruction-modal__intro">
                <i class="pi pi-info-circle instruction-modal__intro-icon"></i>
                <p>Please read the following instructions carefully before starting your assessment session.</p>
              </div>

              <div class="instruction-modal__grid">
                <!-- Section 1: Critical Proctoring Rules -->
                <div class="instruction-card instruction-card--danger">
                  <div class="instruction-card__header">
                    <i class="pi pi-exclamation-triangle instruction-card__icon"></i>
                    <h4 class="instruction-card__title">Critical Proctoring Rules</h4>
                  </div>
                  <ul class="instruction-card__list">
                    <li><strong>Full-Screen Mode:</strong> Upon starting, the assessment will enter full-screen mode. You must remain in this mode throughout the session.</li>
                    <li><strong>Strict Proctoring:</strong> Exiting full-screen mode or switching to other browser tabs/applications will <strong>immediately terminate</strong> your test.</li>
                    <li><strong>Locked Assessment:</strong> If your session is terminated due to technical issues, please contact the HR manager to unlock it.</li>
                  </ul>
                </div>

                <!-- Section 2: Test Navigation & Rules -->
                <div class="instruction-card instruction-card--info">
                  <div class="instruction-card__header">
                    <i class="pi pi-compass instruction-card__icon"></i>
                    <h4 class="instruction-card__title">Test Navigation</h4>
                  </div>
                  <ul class="instruction-card__list">
                    <li>Select an answer and click <strong>'Next'</strong> to save and move forward.</li>
                    <li>Use <strong>'Mark for Review'</strong> to revisit a question later.</li>
                    <li>Click <strong>'Skip'</strong> if you wish to bypass a question.</li>
                    <li><strong>Flexibility:</strong> You can return and update your answers at any time until the timer expires.</li>
                  </ul>
                </div>

                <!-- Section 3: Submission & Support -->
                <div class="instruction-card instruction-card--success">
                  <div class="instruction-card__header">
                    <i class="pi pi-check-circle instruction-card__icon"></i>
                    <h4 class="instruction-card__title">Submission & Support</h4>
                  </div>
                  <ul class="instruction-card__list">
                    <li><strong>Auto-Submission:</strong> Once the timer expires, all attempted answers are automatically saved and submitted.</li>
                    <li><strong>Assistance:</strong> For any confusion or technical difficulties, please contact the volunteers present in the room.</li>
                  </ul>
                </div>
              </div>
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
    const assessmentDate = this.parseDateSafely(assessment.date ?? '');
    const startTimeStr = assessment.startTime ?? '';
    const endTimeStr = assessment.endTime ?? '';

    let startDateTime = this.parseDateSafely(startTimeStr);
    let endDateTime = this.parseDateSafely(endTimeStr);

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

  private parseDateSafely(dateStr: string): Date {
    if (!dateStr) return new Date('');
    
    const normalized = dateStr.trim();
    const parts = normalized.split(/[\sT]+/);
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '';
    const ampmPart = parts.length > 2 ? parts[2] : '';

    const dateSeparators = datePart.includes('-') ? '-' : datePart.includes('/') ? '/' : '';
    if (dateSeparators) {
      const dateParts = datePart.split(dateSeparators);
      if (dateParts.length === 3 && dateParts[0].length <= 2 && dateParts[2].length === 4) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);

        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        if (timePart) {
          const timeParts = timePart.split(':');
          hours = parseInt(timeParts[0], 10);
          minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
          seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

          if (ampmPart && ampmPart.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
          } else if (ampmPart && ampmPart.toLowerCase().includes('am') && hours === 12) {
            hours = 0;
          } else if (timePart.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
          } else if (timePart.toLowerCase().includes('am') && hours === 12) {
            hours = 0;
          }
        }

        return new Date(year, month, day, hours, minutes, seconds);
      }
    }

    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      d = new Date(dateStr.replace(/-/g, '/').replace('T', ' ').split('.')[0]);
    }
    return d;
  }
}
