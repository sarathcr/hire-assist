/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, LocationStrategy } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationStart, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../../../../shared/components/dialog-header/dialog-header.component';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { InputRadioComponent } from '../../../../shared/components/form/input-radio/input-radio.component';
import { ImageComponent } from '../../../../shared/components/image';
import { ImageSkeletonComponent } from '../../../../shared/components/image/image-skeleton';
import { StatusEnum } from '../../../../shared/enums/status.enum';
import { DialogData } from '../../../../shared/models/dialog.models';
import { InterviewService } from '../../../admin/components/assessment/services/interview.service';
import { Interview } from '../../../admin/models/interviewer.model';
import {
  CandidateTestQuestionSet,
  FileDto,
} from '../../models/candidate-test-question-set.model';
import { AssessmentWarningService } from '../../services/assessment-warning.service';
import { CandidateTestService } from '../../services/candidate-test.service';
import { QuestionComponent } from '../question/question.component';
import { TimerComponent } from '../timer/timer.component';
import { CandidateTestSkeletonComponent } from './candidate-test-skeleton';

export interface Payload {
  id?: number;
  interviewId: number;
  candidateId: string;
  assessmentId: number;
  questionId: number;
  answerOptionId: string | number;
  statusId: number;
  duration: string;
}
export interface CandidateTestTermination {
  candidateId: string;
  assessmentId: number;
  terminatedTime: Date;
  terminatedStatus: number;
}
interface CandidateAnswer {
  questionId: number;
  answerOptionId: string | number;
  statusId: number;
}

@Component({
  selector: 'app-candidate-test',
  imports: [
    QuestionComponent,
    CommonModule,
    ButtonComponent,
    InputRadioComponent,
    CarouselModule,
    TimerComponent,
    ButtonModule,
    CheckboxModule,
    FormsModule,
    SkeletonModule,
    CandidateTestSkeletonComponent,
    ImageComponent,
    ImageSkeletonComponent,
  ],
  templateUrl: './candidate-test.component.html',
  styleUrl: './candidate-test.component.scss',
})
export class CandidateTestComponent
  extends BaseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  public data!: CandidateTestQuestionSet;
  // Service
  private readonly warningService = inject(AssessmentWarningService);
  // Signals
  public selectOption = output();
  // Public
  public isLoading = true;
  public isSaving = false;
  public isSubmitting = false;
  public isFullScreen = false;
  public isNavigationIntercepted = false;
  public activeButtonId: number | null = null;
  public selecteArray: string[] = []; // Declare and initialize the array
  public activeQuestion: any = null;
  public selectedValues: Record<number, any> = {};
  public ref: DynamicDialogRef | undefined;
  public responsiveOptions: any[] | undefined;
  public latestFullscreenExitTime!: string;
  public totalQuestions: any[] | undefined;
  private assessmentId!: number;
  public interview!: Interview;
  public previewImageUrls: Record<number, string[]> = {};
  public isImageLoading = true;
  public isImageLoadings: Record<number, boolean> = {};
  public hasImageErrors: Record<number, boolean> = {};
  // Private
  private warningCount!: number;
  private browserRefresh = false;
  private candidateId!: string;
  private candidateInterview: any;
  private questionFileData: Record<number, FileDto[]> = {};
  private optionFileData: Record<number, FileDto[]> = {};
  private imageLoadErrors: Record<number, boolean> = {};
  private attachmentLoadPromises: Promise<void>[] = [];
  private expectedFileCounts: Record<number, number> = {};
  private failedFileCounts: Record<number, number> = {};
  public placeholderImageUrl =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNzAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3IgRmV0Y2hpbmcgQXR0YWNobWVudDwvdGV4dD48L3N2Zz4=';
  @ViewChild(TimerComponent) timerComponent!: TimerComponent;
  constructor(
    private readonly dialog: DialogService,
    private readonly router: Router,
    private readonly locationStrategy: LocationStrategy,
    private readonly candidatetestservice: CandidateTestService,
    private readonly cdRef: ChangeDetectorRef,
    private readonly messageService: MessageService,
    private readonly interviewService: InterviewService,
  ) {
    super();
    this.locationStrategy.onPopState(() => {
      history.pushState(null, '', window.location.href);
      this.showPreventNavigationDialog();
    });

    effect(() => {
      this.warningCount = this.warningService.getWarningCount();
    });

    this.subscriptionList.push(
      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.browserRefresh = !router.navigated;
        }
      }),
    );
  }

  ngOnInit(): void {
    this.candidateInterview = history.state;
    history.pushState(null, '', window.location.href);
    if (!this.candidateInterview?.assessment) {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not load assessment data. Please start again.',
      });

      this.router.navigate(['/candidate']);
    }
    this.assessmentId = this.candidateInterview.assessment?.assessmentId;
    this.candidateId = this.candidateInterview.assessment?.candidateId;

    this.getAllQuestions();

    if (this.warningCount == 2) {
      this.showTestTerminationDialog();
    } else this.enterFullScreenMode();

    //setting 1st question as default
    this.responsiveOptions = [
      {
        breakpoint: '1700px',
        numVisible: 20,
        numScroll: 5,
      },
      {
        breakpoint: '1400px',
        numVisible: 15,
        numScroll: 5,
      },
      {
        breakpoint: '1199px',
        numVisible: 15,
        numScroll: 5,
      },
    ];
  }
  ngAfterViewInit(): void {
    this.fetchCandidateAnswers();
    this.fetchTerminationTimeAndSetTimer();
  }

  // ngAfterViewInit(): void {
  //   setTimeout(() => {
  //     this.fetchCandidateAnswers();
  //     this.fetchTerminationTimeAndSetTimer();
  //   });
  // }

  // Listener Events
  @HostListener('document:fullscreenchange')
  public onFullscreenChange(): void {
    this.isFullScreen = !!document.fullscreenElement;
    if (!this.isFullScreen) {
      this.saveTerminationTime();

      if (this.warningCount <= 1) {
        this.showWarningDialog();
      } else {
        this.showTestTerminationDialog();
      }
    }
  }

  @HostListener('document:visibilitychange')
  public onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.saveTerminationTime();

      if (this.warningCount < 2) {
        this.showWarningDialog();
      } else {
        this.showTestTerminationDialog();
      }
    }
  }

  public onOptionSelect(
    questionId: number,
    selectedValue: string | number,
  ): void {
    // Store the selected value for this question
    this.selectedValues[questionId] = selectedValue;
  }
  public onButtonClick(buttonId: number) {
    this.activeButtonId = buttonId;

    const selectedQuestion = this.data?.questions.find(
      (quest) => quest.id === buttonId,
    );

    if (selectedQuestion) {
      this.activeQuestion = selectedQuestion; // Set the active question
      // Load images for the clicked question and its options
      this.loadQuestionAttachments(selectedQuestion);
    }
  }

  public onReviewBtnClick() {
    if (this.isSaving) return;
    this.handleAnswer(3).subscribe({
      next: () => {
        // Navigation happens in handleAnswer after save completes
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  public onSkipBtnClick() {
    if (this.isSaving) return;
    this.handleAnswer(5).subscribe({
      next: () => {
        // Navigation happens in handleAnswer after save completes
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  public onSaveBtnClick() {
    if (this.isSaving) return;
    this.handleAnswer(6).subscribe({
      next: () => {
        // Navigation happens in handleAnswer after save completes
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  public onFinishBtnClick() {
    if (this.isSaving || this.isSubmitting) return;
    this.handleAnswer(6).subscribe({
      next: () => {
        // After save completes, submit the test
        this.onTestSubmit();
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  public onCheckboxChange(event: CheckboxChangeEvent, questionId: number) {
    const selectedOptionId = (event.originalEvent?.target as HTMLInputElement)
      ?.value;

    if (this.selecteArray.includes(selectedOptionId)) {
      const index = this.selecteArray.indexOf(selectedOptionId);

      this.selecteArray.splice(index, 1);
    } else if (this.selecteArray.length > 0) {
      this.selecteArray = [...this.selecteArray, selectedOptionId];
    } else {
      this.selecteArray.push(selectedOptionId);
    }
    this.selectedValues[questionId] = this.selecteArray;
  }

  public onTestSubmit() {
    const modalData: DialogData = {
      message:
        'Your about to submit the exam. Once you submitted, you cannot go back to the exam page. Do you still want to continue?',
      isChoice: true,
      acceptButtonText: 'Submit',
      cancelButtonText: 'cancel',
      disableClose: true,
    };
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Warning!',
      width: '30vw',
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
        this.isSubmitting = true;
        this.exitFullScreenMode();
        this.addCandidateScores(
          this.assessmentId,
          this.candidateInterview.assessment.assessmentRoundId,
        ).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.router.navigate(['candidate/thank-you']);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });
      }
    });
  }
  public previewImage(file: FileDto, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isImageLoading = true;
      this.isImageLoadings[id] = true;
      this.interviewService
        .GetFiles({
          blobId: file.blobId || file.id,
          attachmentType: file.attachmentType,
        })
        .subscribe({
          next: (blob: Blob) => {
            const imageUrl = URL.createObjectURL(blob);
            if (!this.previewImageUrls[id]) {
              this.previewImageUrls[id] = [];
            }
            this.previewImageUrls[id].push(imageUrl);
            setTimeout(() => {
              this.isImageLoading = false;
              // Don't set isImageLoadings[id] to false here - let the Promise.allSettled handle it
            }, 300);
            resolve();
          },

          error: (error) => {
            this.isImageLoading = false;
            this.imageLoadErrors[id] = true;
            reject(error);
          },
        });
    });
  }

  // Private
  private handleAnswer(statusId: number): Observable<void> {
    if (this.activeButtonId === null || !this.activeQuestion) {
      return of(void 0);
    }

    const selectedValue = this.selectedValues[this.activeButtonId] ?? null;
    this.activeQuestion.status = this.getStatusFromId(statusId);

    const answerOptionId = this.getAnswerOptionId(selectedValue);

    const payload: Payload = {
      interviewId: this.candidateInterview.assessment?.interviewId,
      candidateId: this.candidateId,
      assessmentId: this.assessmentId,
      questionId: this.activeQuestion.id,
      answerOptionId,
      statusId,
      duration: this.timerComponent.getCurrentFormattedTime(),
    };

    this.isSaving = true;
    return this.saveOrUpdateCandidateAnswer(payload).pipe(
      switchMap(() => {
        this.isSaving = false;
        this.handleQuestionNavigation();
        return of(void 0);
      }),
    );
  }

  private getStatusFromId(
    statusId: number,
  ): 'reviewed' | 'skipped' | 'saved' | 'unAttended' | 'paused' {
    switch (statusId) {
      case 3:
        return 'reviewed';
      case 5:
        return 'skipped';
      case 6:
        return 'saved';
      case 7:
        return 'paused';
      default:
        return 'unAttended';
    }
  }

  private getAnswerOptionId(selectedValue: any): string {
    let answerOptionId: string;
    if (this.activeQuestion.isMultipleChoice) {
      this.onCheckboxChange(
        {
          checked: selectedValue,
          originalEvent: null as unknown as Event | undefined,
        } as CheckboxChangeEvent,
        this.activeButtonId as number,
      );
      answerOptionId = Array.isArray(selectedValue)
        ? selectedValue.join(',')
        : '';
    } else {
      if (selectedValue !== null && this.activeButtonId !== null) {
        this.onOptionSelect(this.activeButtonId, selectedValue);
      }
      answerOptionId = selectedValue ? String(selectedValue) : '';
    }
    if (this.activeQuestion.status === 'skipped') {
      answerOptionId = '';
    }
    return answerOptionId;
  }

  private saveOrUpdateCandidateAnswer(payload: Payload): Observable<void> {
    return this.candidatetestservice
      .getCandidateAnswer(payload.assessmentId, payload.candidateId)
      .pipe(
        switchMap((existingAnswers: any) => {
          // Handle both array and single object responses
          const answersArray = Array.isArray(existingAnswers)
            ? existingAnswers
            : [existingAnswers];
          const existingAnswer = answersArray.find(
            (ans: any) => ans?.questionId === payload.questionId,
          );
          if (existingAnswer?.id) {
            payload.id = existingAnswer.id;
            return this.updateCandidateAnswer(payload);
          } else {
            return this.createCandidateAnswer(payload);
          }
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.type || 'Failed to save answer',
          });
          this.isSaving = false;
          return throwError(() => error);
        }),
      );
  }

  private handleQuestionNavigation(): void {
    const currentIndex = this.data.questions.findIndex(
      (q) => q.id === this.activeQuestion.id,
    );
    if (currentIndex === this.data.questions.length - 1) {
      this.onTestSubmit();
    } else {
      this.moveToNextQuestion();
    }
  }

  private fetchCandidateAnswers(): void {
    if (this.assessmentId != null && this.candidateId != null) {
      this.candidatetestservice
        .getCandidateAnswer(this.assessmentId, this.candidateId)
        .subscribe({
          next: (answers: CandidateAnswer[]) => {
            answers.forEach((answer: CandidateAnswer) => {
              const question =
                this.data &&
                this.data.questions &&
                this.data.questions.find((q) => q.id === answer.questionId);

              if (question) {
                // Set selected answers
                if (question.isMultipleChoice) {
                  this.selectedValues[answer.questionId] =
                    answer.answerOptionId?.toString().split(',') ?? [];
                } else {
                  this.selectedValues[answer.questionId] =
                    answer.answerOptionId;
                }
                question.status = this.mapStatusIdToStatus(answer.statusId);
              }
            });

            this.cdRef.markForCheck();

            // Set first question as active (if not already)
            if (this.data && this.data.questions.length > 0) {
              this.activeButtonId ??= this.data.questions[0].id;
              this.activeQuestion ??= this.data.questions[0];
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.type,
            });
          },
        });
    }
  }

  private mapStatusIdToStatus(
    statusId: number,
  ): 'reviewed' | 'skipped' | 'saved' | 'unAttended' | 'paused' {
    return this.getStatusFromId(statusId);
  }

  private enterFullScreenMode(): void {
    if (typeof document !== 'undefined') {
      document.documentElement
        .requestFullscreen()
        .then(() =>
          this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Entered fullscreen mode.',
          }),
        )
        .catch(() =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to enter fullscreen mode',
          }),
        );
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warn',
        detail:
          'Document is not defined. This code is running in a non-browser environment.',
      });
    }
  }

  private showWarningDialog(): void {
    const modalData: DialogData = this.getWarningDialogData();
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      width: '50vw',
      modal: true,
      focusOnShow: false,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      templates: {
        header: DialogHeaderComponent,
        footer: DialogFooterComponent,
      },
    });
    this.ref?.onClose.subscribe((result) => {
      if (result) {
        this.warningService.setWarningCount(1);
        this.enterFullScreenMode();
        this.ref?.close(true);
      } else {
        this.router.navigate(['candidate/thank-you']);
      }
    });
  }

  private getWarningDialogData(): DialogData {
    return {
      headerTitle: 'Warning',
      warningCount: this.warningCount,
      message: `You have exited fullscreen mode/switched tab. Please return to fullscreen to continue your assessment. This is your final warning.`,
      isChoice: true,
      closeOnNavigation: false,
      acceptButtonText: 'Continue',
      cancelButtonText: 'I Quit',
    };
  }

  private showTestTerminationDialog() {
    const modalData: DialogData = this.getTestTerminationDialogData();
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      header: 'Sorry',
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
    this.ref?.onClose.subscribe((result) => {
      if (result) {
        this.exitFullScreenMode();
        this.router.navigate(['candidate/thank-you']);
      }
    });
  }

  private getTestTerminationDialogData(): DialogData {
    return {
      message: `You have used your maximum attempts by exiting full screen mode. Please contact invigilator/HR for further information`,
      isChoice: false,
      closeOnNavigation: true,
      acceptButtonText: 'OK',
    };
  }
  //if save/review/skip button clicked then the next question will be showing automatically
  private moveToNextQuestion() {
    if (this.activeButtonId !== null) {
      const currentIndex = this.data.questions.findIndex(
        (option) => option.id === this.activeButtonId,
      );

      if (currentIndex >= 0 && currentIndex < this.data.questions.length - 1) {
        this.activeButtonId = this.data.questions[currentIndex + 1].id;
        this.activeQuestion = this.data.questions[currentIndex + 1];
        // Load images for the next question and its options
        this.loadQuestionAttachments(this.activeQuestion);
      }
    }
  }

  private showPreventNavigationDialog(): void {
    if (this.ref) {
      return;
    }

    if (this.router.url === '/candidate/test') {
      const modalData: DialogData = this.getPreventNavigationDialogData();

      this.ref = this.dialog.open(DialogComponent, {
        data: modalData,
        header: 'Warning',
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

      this.ref.onClose.subscribe(() => {
        this.ref = undefined;
      });
    }
  }

  private getPreventNavigationDialogData(): DialogData {
    return {
      message: `You are not allowed to navigate away from this page. Please complete the test.`,
      isChoice: false,
      closeOnNavigation: true,
      acceptButtonText: 'Continue',
    };
  }

  private getAllQuestions() {
    this.isLoading = true;

    const next = (res: CandidateTestQuestionSet) => {
      if (res) {
        this.setInitialActiveQuestion(res);
        this.data = res;
        // Store file data for lazy loading instead of loading immediately
        res.questions.forEach((q) => {
          if (q.hasAttachment && q.file?.length) {
            this.questionFileData[q.id] = q.file;
          }
          q.options?.forEach((opt) => {
            if (opt.hasAttachments && opt.file?.length) {
              this.optionFileData[opt.id] = opt.file;
            }
          });
        });
        this.isLoading = false;
        // Load images for the initial active question
        if (this.activeQuestion) {
          this.loadQuestionAttachments(this.activeQuestion);
        }
      }
    };
    const error = (error: string) => {
      this.isLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.candidatetestservice.getQuestionSet().subscribe({ next, error });
  }

  private createCandidateAnswer(payload: Payload): Observable<void> {
    return this.candidatetestservice.addcandidateAnswer(payload).pipe(
      switchMap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Candidate answer created successfully.',
        });
        return of(void 0);
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Creation Failed',
          detail: `Unable to create candidate answer: ${error?.type || error}`,
        });
        return throwError(() => error);
      }),
    );
  }

  private updateCandidateAnswer(payload: Payload): Observable<void> {
    return this.candidatetestservice.updateCandidateAnswer(payload).pipe(
      switchMap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Candidate answer updated successfully.',
        });
        return of(void 0);
      }),
      catchError((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Error',
          detail: `Failed to update candidate answer: ${error?.type || error}`,
        });
        return throwError(() => error);
      }),
    );
  }

  private addCandidateScores(
    assessmentId: number,
    assessmentRoundId: number,
  ): Observable<void> {
    return this.candidatetestservice
      .addCandidateScore(assessmentId, assessmentRoundId)
      .pipe(
        switchMap((score: number) => {
          this.interview = {
            id: this.candidateInterview.assessment.interviewId,
            statusId: StatusEnum.Completed,
            score: score,
          };
          return this.interviewService.UpdateInterview(
            this.candidateInterview.assessment.interviewId,
            this.interview,
          );
        }),
        switchMap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Successfully completed ',
          });
          return of(void 0);
        }),
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.type || 'Failed to submit test',
          });
          return throwError(() => error);
        }),
      );
  }

  private setInitialActiveQuestion(data: CandidateTestQuestionSet) {
    if (data?.questions.length > 0) {
      this.activeButtonId = data.questions[0].id;
      this.activeQuestion = data.questions.find(
        (q) => q.id === this.activeButtonId,
      );
    }
    this.totalQuestions = data?.questions;
  }

  private saveTerminationTime(): void {
    if (!this.timerComponent) return;
    const remainingTime = this.timerComponent.getCurrentFormattedTime();

    const payload = {
      candidateId: this.candidateId,
      assessmentId: this.assessmentId,
      terminatedTime: remainingTime,
      terminatedStatus: 11, //paused status
    };

    this.candidatetestservice
      .addcandidateTestTerminationTime(payload)
      .subscribe();
  }

  private exitFullScreenMode(): void {
    if (typeof document !== 'undefined') {
      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => {
          this.latestFullscreenExitTime = new Date().toISOString();
          this.messageService.add({
            severity: 'info',
            summary: 'Info',
            detail: 'Exited fullscreen mode.',
          });
        });
      }
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warn',
        detail:
          'Document is not defined. This code is running in a non-browser environment.',
      });
    }
  }

  private fetchTerminationTimeAndSetTimer(): void {
    this.candidatetestservice
      .getCandidateTestTerminationTime(this.assessmentId, this.candidateId)
      .subscribe({
        next: (response) => {
          if (this.timerComponent) {
            if (
              response?.terminatedTime != null &&
              response?.terminatedTime != '00:00:00'
            ) {
              const [hours, minutes, seconds] = response.terminatedTime
                .split(':')
                .map(Number);
              const secondsLeft = hours * 3600 + minutes * 60 + seconds;
              this.timerComponent.setInitialTime(secondsLeft);
            } else {
              this.timerComponent.setInitialTime(3600);
            }
          }
        },
        error: () => {
          if (this.timerComponent) {
            this.timerComponent.setInitialTime(3600);
          }
        },
      });
  }

  private loadQuestionAttachments(question: any): void {
    // Reset error tracking for this question's attachments
    const questionErrors: number[] = [];
    this.attachmentLoadPromises = [];

    // Load question images if not already loaded
    // Check if question has attachment and file data exists
    if (question.hasAttachment) {
      // Try to get file data from stored data first, then from question object directly
      const questionFiles = this.questionFileData[question.id] || question.file;
      const existingUrls = this.previewImageUrls[question.id];
      const hasImagesLoaded = existingUrls && existingUrls.length > 0;

      if (questionFiles && questionFiles.length > 0 && !hasImagesLoaded) {
        // Initialize the array if it doesn't exist
        if (!this.previewImageUrls[question.id]) {
          this.previewImageUrls[question.id] = [];
        }
        // Track expected file count
        this.expectedFileCounts[question.id] = questionFiles.length;
        this.failedFileCounts[question.id] = 0;
        // Set loading state
        this.isImageLoadings[question.id] = true;

        const questionPromises: Promise<void>[] = [];
        questionFiles.forEach((file: FileDto) => {
          const promise = this.previewImage(file, question.id).catch(
            (error) => {
              questionErrors.push(question.id);
              this.imageLoadErrors[question.id] = true;
              this.failedFileCounts[question.id] =
                (this.failedFileCounts[question.id] || 0) + 1;
              this.showAttachmentErrorMessage(question.id, 'question');
            },
          );
          questionPromises.push(promise);
          this.attachmentLoadPromises.push(promise);
        });

        // Check completion after all promises
        Promise.allSettled(questionPromises).then((results) => {
          const successCount = results.filter(
            (r) => r.status === 'fulfilled',
          ).length;
          // If no images loaded successfully, show error placeholder
          if (successCount === 0 && questionFiles.length > 0) {
            this.hasImageErrors[question.id] = true;
          }
          this.isImageLoadings[question.id] = false;
        });
      }
    }

    // Load option images if not already loaded
    if (question.options && question.options.length > 0) {
      question.options.forEach((opt: any) => {
        if (opt.hasAttachments) {
          // Try to get file data from stored data first, then from option object directly
          const optionFiles = this.optionFileData[opt.id] || opt.file;
          const hasOptionImagesLoaded =
            this.previewImageUrls[opt.id] &&
            this.previewImageUrls[opt.id].length > 0;

          if (optionFiles && optionFiles.length > 0 && !hasOptionImagesLoaded) {
            // Initialize the array if it doesn't exist
            if (!this.previewImageUrls[opt.id]) {
              this.previewImageUrls[opt.id] = [];
            }
            // Track expected file count
            this.expectedFileCounts[opt.id] = optionFiles.length;
            this.failedFileCounts[opt.id] = 0;
            // Set loading state
            this.isImageLoadings[opt.id] = true;

            const optionPromises: Promise<void>[] = [];
            optionFiles.forEach((file: FileDto) => {
              const promise = this.previewImage(file, opt.id).catch((error) => {
                questionErrors.push(opt.id);
                this.imageLoadErrors[opt.id] = true;
                this.failedFileCounts[opt.id] =
                  (this.failedFileCounts[opt.id] || 0) + 1;
                this.showAttachmentErrorMessage(opt.id, 'option');
              });
              optionPromises.push(promise);
              this.attachmentLoadPromises.push(promise);
            });

            // Check completion after all promises
            Promise.allSettled(optionPromises).then((results) => {
              const successCount = results.filter(
                (r) => r.status === 'fulfilled',
              ).length;
              // If no images loaded successfully, show error placeholder
              if (successCount === 0 && optionFiles.length > 0) {
                this.hasImageErrors[opt.id] = true;
              }
              this.isImageLoadings[opt.id] = false;
            });
          }
        }
      });
    }
  }

  private showAttachmentErrorMessage(
    id: number,
    type: 'question' | 'option',
  ): void {
    // Show error message but stay on the page
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load ${type} attachment. Please continue with the assessment.`,
      life: 5000,
    });
  }
}
