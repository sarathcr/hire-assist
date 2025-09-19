/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, LocationStrategy } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationStart, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SkeletonModule } from 'primeng/skeleton';
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
  // Private
  private warningCount!: number;
  private browserRefresh = false;
  private candidateId!: string;
  private candidateInterview: any;
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

    this.activeQuestion = this.data?.questions.find((q) => q.id === buttonId);

    const selectedQuestion = this.data?.questions.find(
      (quest) => quest.id === buttonId,
    );

    if (selectedQuestion) {
      this.activeQuestion = selectedQuestion; // Set the active question
    }
  }

  public onReviewBtnClick() {
    this.handleAnswer(3);
  }

  public onSkipBtnClick() {
    this.handleAnswer(5);
  }

  public onSaveBtnClick() {
    this.handleAnswer(6);
  }

  public onFinishBtnClick() {
    this.handleAnswer(6);
    this.onTestSubmit();
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
        this.exitFullScreenMode();
        this.addCandidateScores(
          this.assessmentId,
          this.candidateInterview.assessment.assessmentRoundId,
        );
        this.router.navigate(['candidate/thank-you']);
      }
    });
  }
  public previewImage(file: FileDto, id: number): void {
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
            this.isImageLoadings[id] = false;
          }, 300);
        },

        error: () => {
          this.isImageLoading = false;
          this.isImageLoadings[id] = false;
          console.error('Failed to load image');
        },
      });
  }

  // Private
  private handleAnswer(statusId: number) {
    if (this.activeButtonId === null || !this.activeQuestion) return;

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

    this.saveOrUpdateCandidateAnswer(payload);

    this.handleQuestionNavigation();
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

  private saveOrUpdateCandidateAnswer(payload: Payload): void {
    this.candidatetestservice
      .getCandidateAnswer(payload.assessmentId, payload.candidateId)
      .subscribe({
        next: (existingAnswer) => {
          if (existingAnswer?.id) {
            payload.id = existingAnswer.id;
            this.updateCandidateAnswer(payload);
          } else {
            this.createCandidateAnswer(payload);
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
        res.questions.forEach((q) => {
          if (q.hasAttachment && q.file?.length) {
            this.isImageLoading = true;
            this.isImageLoadings[q.id] = true;
            q.file.forEach((file: FileDto) => this.previewImage(file, q.id));
          }
          q.options?.forEach((opt) => {
            if (opt.hasAttachments && opt.file?.length) {
              this.isImageLoading = true;
              this.isImageLoadings[opt.id] = true;
              opt.file.forEach((file: FileDto) =>
                this.previewImage(file, opt.id),
              );
            }
          });
        });
        this.isLoading = false;
        this.isImageLoading = false;
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

  private createCandidateAnswer(payload: Payload) {
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Candidate answer created successfully.',
      });
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'warn',
        summary: 'Creation Failed',
        detail: `Unable to create candidate answer: ${error}`,
      });
    };
    this.candidatetestservice
      .addcandidateAnswer(payload)
      .subscribe({ next, error });
  }

  private updateCandidateAnswer(payload: Payload) {
    const next = () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Candidate answer updated successfully.',
      });
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Update Error',
        detail: `Failed to update candidate answer: ${error}`,
      });
    };

    this.candidatetestservice
      .updateCandidateAnswer(payload)
      .subscribe({ next, error });
  }

  private addCandidateScores(assessmentId: number, assessmentRoundId: number) {
    const next = (res: number) => {
      const score = res;
      this.interview = {
        id: this.candidateInterview.assessment.interviewId,
        statusId: StatusEnum.Completed,
        score: score,
      };
      const next = () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Successfully completed ',
        });
      };
      const error = (error: string) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error,
        });
      };
      this.interviewService
        .UpdateInterview(
          this.candidateInterview.assessment.interviewId,
          this.interview,
        )
        .subscribe({ next, error });
    };
    const error = (error: string) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    };
    this.candidatetestservice
      .addCandidateScore(assessmentId, assessmentRoundId)
      .subscribe({ next, error });
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
}
