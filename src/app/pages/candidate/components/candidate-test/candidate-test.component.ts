/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, LocationStrategy } from '@angular/common';
import {
  Component,
  effect,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { Tooltip } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { QuestionComponent } from '../question/question.component';
import { InputRadioComponent } from '../../../../shared/components/form/input-radio/input-radio.component';
import { CarouselModule } from 'primeng/carousel';
import { TimerComponent } from '../timer/timer.component';
import { CandidateTestQuestionSet } from '../../models/candidate-test-question-set.model';
import { BaseComponent } from '../../../../shared/components/base/base.component';
import { AssessmentWarningService } from '../../services/assessment-warning.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NavigationStart, Router } from '@angular/router';
import { CandidateTestService } from '../../services/candidate-test.service';
import { DialogData } from '../../../../shared/models/dialog.models';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { DialogFooterComponent } from '../../../../shared/components/dialog-footer/dialog-footer.component';
import { DialogHeaderComponent } from '../../../../shared/components/dialog-header/dialog-header.component';

export interface Payload {
  id?: number;
  interviewId: number;
  candidateId: string;
  assessmentId: number;
  questionId: number;
  answerOptionId: string | number;
  statusId: number;
  duration: Date | null;
}
interface CandidateAnswer {
  questionId: number;
  answerOptionId: string | number;
  // Add other properties if needed
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
    Tooltip,
    ButtonModule,
    CheckboxModule,
    FormsModule,
  ],
  templateUrl: './candidate-test.component.html',
  styleUrl: './candidate-test.component.scss',
})
export class CandidateTestComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public data!: CandidateTestQuestionSet;

  // Service
  private warningService = inject(AssessmentWarningService);
  // Signals
  public selectOption = output();
  // Public
  public isFullScreen = false;
  public isNavigationIntercepted = false;
  public activeButtonId: number | null = null;
  public isFullscreen = false;
  public selecteArray: string[] = []; // Declare and initialize the array

  public activeQuestion: any = null;

  public selectedValues: Record<number, any> = {};
  public ref: DynamicDialogRef | undefined;

  public responsiveOptions: any[] | undefined;

  public totalQuestions: any[] | undefined;
  private assessmentId!: number;
  private candidateId!: string;

  private candidateInterview: any;

  // Private
  private warningCount!: number;
  private browserRefresh = false;

  constructor(
    private dialog: DialogService,
    private router: Router,
    private locationStrategy: LocationStrategy,
    private candidatetestservice: CandidateTestService,
  ) {
    super();
    this.locationStrategy.onPopState(() => {
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
    console.log('browserRefresh', this.browserRefresh);
  }

  ngOnInit(): void {
    this.candidateInterview = history.state;
    this.assessmentId = this.candidateInterview.assessment.assessmentId;
    this.candidateId = this.candidateInterview.assessment.candidateId;

    this.getAllQuestions();
    this.fetchCandidateAnswers();

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

  // Listener Events
  @HostListener('document:fullscreenchange')
  public onFullscreenChange(): void {
    this.isFullScreen = !!document.fullscreenElement;
    if (!this.isFullScreen && this.warningCount <= 1) {
      this.showWarningDialog();
    } else if (!this.isFullScreen && this.warningCount > 1) {
      this.showTestTerminationDialog();
    }
  }

  @HostListener('document:visibilitychange')
  public onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      console.log('Tab switched. Showing warning dialog...');
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

      this.selecteArray.splice(index, 1); // Remove the item from the array
    } else {
      if (this.selecteArray.length > 0) {
        this.selecteArray = [...this.selecteArray, selectedOptionId]; // Add the item to the array
      } else {
        this.selecteArray.push(selectedOptionId); // Add the item to the array
      }
    }
    this.selectedValues[questionId] = this.selecteArray; // Store the selected values in the selectedValues object
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
        this.addCandidateScores(
          this.assessmentId,
          this.candidateInterview.assessment.assessmentRoundId,
        );
        this.router.navigate(['candidate/thank-you']);
      }
    });
  }
  // Private
  private handleAnswer(statusId: number) {
    if (this.activeButtonId !== null && this.activeQuestion) {
      const selectedValue = this.selectedValues[this.activeButtonId] ?? null;
      this.activeQuestion.status =
        statusId === 3
          ? 'reviewed'
          : statusId === 5
            ? 'skipped'
            : statusId === 6
              ? 'saved'
              : 'unAttended';

      let answerOptionId: string;

      if (this.activeQuestion.isMultipleChoice) {
        this.onCheckboxChange(
          {
            checked: selectedValue,
            originalEvent: null as unknown as Event | undefined, // Explicitly cast null to the expected type
          } as CheckboxChangeEvent,
          this.activeButtonId,
        );

        answerOptionId = Array.isArray(selectedValue)
          ? selectedValue.join(',')
          : '';
      } else {
        if (selectedValue !== null) {
          this.onOptionSelect(this.activeButtonId, selectedValue);
        }
        answerOptionId = selectedValue ? String(selectedValue) : '';
      }
      const payload: Payload = {
        interviewId: this.candidateInterview.assessment.interviewId,
        candidateId: this.candidateId,
        assessmentId: this.assessmentId,
        questionId: this.activeQuestion.id,
        answerOptionId: answerOptionId,
        statusId,
        duration: null,
      };
      this.candidatetestservice
        .getCandidateAnswer(payload.assessmentId, payload.candidateId)
        .subscribe({
          next: (existingAnswer) => {
            if (existingAnswer && existingAnswer.id) {
              // Update the existing entry
              payload.id = existingAnswer.id;
              this.updateCandidateAnswer(payload);
            } else {
              // Create a new entry
              this.createCandidateAnswer(payload);
            }
          },
          error: (error) => {
            console.log('Error checking existing answer:', error);
          },
        });
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
              const question = this.data.questions.find(
                (q) => q.id === answer.questionId,
              );
              if (question?.isMultipleChoice) {
                this.selectedValues[answer.questionId] = answer.answerOptionId
                  .toString()
                  .split(',');
              } else {
                this.selectedValues[answer.questionId] = answer.answerOptionId;
              }
            });
            // Optionally, set the first question as active
            if (this.data && this.data.questions.length > 0) {
              this.activeButtonId = this.data.questions[0].id;
              this.activeQuestion = this.data.questions[0];
            }
          },
          error: (error) => {
            console.log('Error fetching candidate answers:', error);
          },
        });
    }
  }

  private enterFullScreenMode(): void {
    if (typeof document !== 'undefined') {
      document.documentElement
        .requestFullscreen()
        .then(() => console.log('Entered fullscreen mode.'))
        .catch((err) => console.error('Failed to enter fullscreen mode:', err));
    } else {
      console.warn(
        'Document is not defined. This code is running in a non-browser environment.',
      );
    }
  }

  private showWarningDialog(): void {
    const modalData: DialogData = this.getWarningDialogData();
    this.ref = this.dialog.open(DialogComponent, {
      data: modalData,
      // header: 'Warning',
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
      message: `You have exited fullscreen mode. Please return to fullscreen to continue your assessment. This is your final warning.`,
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
      } else {
        console.log('no more questions....');
      }
    }
  }

  private showPreventNavigationDialog(): void {
    if (this.router.url === '/candidate/test') {
      // Ensure it only triggers on this route
      const modalData: DialogData = this.getPreventNavigationDialogData();

      if (!this.ref) {
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
      }

      this.ref?.onClose.subscribe((result) => {
        if (result) {
          this.isNavigationIntercepted = false;
          console.log('Navigation prevented.');

          if (this.warningCount == 2) {
            this.showWarningDialog();
          } else {
            this.showTestTerminationDialog();
          }
          this.ref?.close();
        }
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
    const next = (res: CandidateTestQuestionSet) => {
      if (res) {
        this.setInitialActiveQuestion(res);
        this.data = res;
      }
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.candidatetestservice.getQuestionSet().subscribe({ next, error });
  }

  private createCandidateAnswer(payload: Payload) {
    const next = () => {
      console.log('Candidate answer created successfully.');
    };
    const error = (error: string) => {
      console.log('ERROR', error);
    };
    this.candidatetestservice
      .addcandidateAnswer(payload)
      .subscribe({ next, error });
  }

  private updateCandidateAnswer(payload: Payload) {
    const next = () => {
      console.log('Candidate answer updated successfully.');
    };
    const error = (error: string) => {
      console.log('Error updating candidate answer:', error);
    };

    this.candidatetestservice
      .updateCandidateAnswer(payload)
      .subscribe({ next, error });
  }

  private addCandidateScores(assessmentId: number, assessmentRoundId: number) {
    const next = () => {
      console.log('Candidate score added successfully.');
    };
    const error = (error: string) => {
      console.log('Error updating candidate answer:', error);
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
}
