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
import { NavigationStart, Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../shared/components/base/base.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogFooterComponent } from '../../shared/components/dialog-footer/dialog-footer.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { InputRadioComponent } from '../../shared/components/form/input-radio/input-radio.component';
import { CarouselModule } from 'primeng/carousel';
import { QuestionComponent } from '../../shared/components/question/question.component';
import { DialogData } from '../../shared/models/dialog-models';
import { AssessmentWarningService } from '../../shared/services/assessment-warning.service';
import { DialogHeaderComponent } from '../../shared/components/dialog-header/dialog-header.component';

export interface Questions {
  id: number;
  label: string;
  status?: string;
}
@Component({
  selector: 'app-assessment',
  imports: [
    QuestionComponent,
    CommonModule,
    ButtonComponent,
    InputRadioComponent,
    CarouselModule,
  ],
  providers: [DialogService],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  // Service
  private warningService = inject(AssessmentWarningService);
  // Signals
  public selectOption = output();
  // Public
  public isFullScreen = false;
  public isNavigationIntercepted = false;
  public activeButtonId: number | null = null;
  public isFullscreen = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public activeQuestion: any = null;
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  public selectedValues: { [key: number]: string | number } = {};
  public ref: DynamicDialogRef | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public responsiveOptions: any[] | undefined;

  numberOfQuestions: Questions[] = [
    { id: 1, label: ' 1', status: '' },
    { id: 2, label: ' 2', status: '' },
    { id: 3, label: ' 3', status: '' },
    { id: 4, label: ' 4', status: '' },
    { id: 5, label: ' 5', status: '' },
    // { id: 6, label: ' 6', status: '' },
    // { id: 7, label: ' 7', status: '' },
    // { id: 8, label: ' 8', status: '' },
    // { id: 9, label: ' 9', status: '' },
    // { id: 10, label: ' 10', status: '' },
    // { id: 11, label: ' 11', status: '' },
    // { id: 12, label: ' 12', status: '' },
    // { id: 13, label: ' 13', status: '' },
    // { id: 14, label: ' 14', status: '' },
    // { id: 15, label: ' 15', status: '' },
    // { id: 16, label: ' 16', status: '' },
    // { id: 17, label: ' 12', status: '' },
    // { id: 18, label: ' 13', status: '' },
    // { id: 19, label: ' 14', status: '' },
    // { id: 20, label: ' 15', status: '' },
  ];
  questionSet = [
    {
      id: 1,
      question: { id: 1, text: 'What is the sum of 5 + 2? ', image: '' },
      options: [
        { id: 1, text: '5' },
        { id: 2, text: '6' },
        { id: 3, text: '7' },
        { id: 4, text: '8' },
      ],
    },
    {
      id: 2,
      question: {
        id: 2,
        text: 'What is the name of the pattern below ? ',
        image: 'question/pyramid.png',
      },
      options: [
        { id: 1, text: 'Pyramid' },
        { id: 2, text: 'Triangle' },
        { id: 3, text: 'Half Pyramid' },
        { id: 4, text: 'Half Number Pyramid' },
      ],
    },
    {
      id: 3,
      question: {
        id: 3,
        text: 'Where is the capital of India ? ',
        image: '',
      },
      options: [
        { id: 1, text: 'Calcutta' },
        { id: 2, text: 'Mumbai' },
        { id: 3, text: 'Haryana' },
        { id: 4, text: 'New Delhi' },
      ],
    },
    {
      id: 4,
      question: {
        id: 4,
        text: 'Which country is the most peaceful in the world ?',
        image: '',
      },
      options: [
        { id: 1, text: 'Pakistan' },
        { id: 2, text: 'Ireland' },
        { id: 3, text: 'North Korea' },
        { id: 4, text: 'New Zeland' },
      ],
    },
    {
      id: 5,
      question: {
        id: 5,
        text: 'Which potraits shows the eiffel tower ?',
        image: '',
      },
      options: [
        { id: 1, text: '', image: 'option/cn-tower.jpg' },
        { id: 2, text: '', image: 'option/eiffel-tower.jpg' },
        { id: 3, text: '', image: 'option/pisa-tower.jpg' },
        { id: 4, text: '', image: 'option/twin-tower.jpg' },
      ],
    },
  ];

  // Private
  private warningCount!: number;
  private browserRefresh = false;

  constructor(
    private dialog: DialogService,
    private router: Router,
    private locationStrategy: LocationStrategy
  ) {
    super();
    this.locationStrategy.onPopState(() => {
      this.showPreventNavigationDialog();
    });

    effect(() => {
      this.warningCount = this.warningService.getWarningCount();
    });

    this.subscriptionList.push(
      router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
          this.browserRefresh = !router.navigated;
        }
      })
    );
    console.log('browserRefresh', this.browserRefresh);
  }

  ngOnInit(): void {
    if (this.warningCount == 2) {
      this.showTestTerminationDialog();
    } else this.enterFullScreenMode();

    //setting 1st question as default
    if (this.numberOfQuestions.length > 0) {
      this.activeButtonId = this.numberOfQuestions[0].id;
      this.activeQuestion = this.questionSet.find(
        q => q.id === this.activeButtonId
      );
      console.log(this.activeButtonId, '===>');
    }
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1,
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
    selectedValue: string | number
  ): void {
    console.log('Selected value for question', questionId, ':', selectedValue);
    // Store the selected value for this question
    this.selectedValues[questionId] = selectedValue;
  }
  public onButtonClick(buttonId: number) {
    this.activeButtonId = buttonId;
    const selectedQuestion = this.questionSet.find(q => q.id === buttonId);

    if (selectedQuestion) {
      this.activeQuestion = selectedQuestion; // Set the active question
    }
  }

  public onReviewBtnClick() {
    this.numberOfQuestions.forEach(option => {
      if (this.activeButtonId === option.id) {
        option.status = 'reviewed';
      }
    });
    this.moveToNextQuestion();
  }
  public onSkipBtnClick() {
    this.numberOfQuestions.forEach(option => {
      if (this.activeButtonId === option.id) {
        option.status = 'skipped';
      }
    });
    this.moveToNextQuestion();
  }
  public onSaveBtnClick() {
    this.numberOfQuestions.forEach(option => {
      if (this.activeButtonId === option.id) {
        option.status = 'saved';
      }
    });
    this.moveToNextQuestion();
  }

  // Private
  private enterFullScreenMode(): void {
    if (typeof document !== 'undefined') {
      document.documentElement
        .requestFullscreen()
        .then(() => console.log('Entered fullscreen mode.'))
        .catch(err => console.error('Failed to enter fullscreen mode:', err));
    } else {
      console.warn(
        'Document is not defined. This code is running in a non-browser environment.'
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
    this.ref?.onClose.subscribe(result => {
      if (result) {
        this.warningService.setWarningCount(1);
        this.enterFullScreenMode();
        this.ref?.close();
      }
    });
  }

  private getWarningDialogData(): DialogData {
    return {
      headerTitle: 'Warning',
      warningCount: this.warningCount,
      message: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
      isChoice: true,
      closeOnNavigation: true,
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
    this.ref?.onClose.subscribe(result => {
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
    };
  }

  //if save/review/skip button clicked then the next question will be showing automatically
  private moveToNextQuestion() {
    if (this.activeButtonId !== null) {
      const currentIndex = this.numberOfQuestions.findIndex(
        option => option.id === this.activeButtonId
      );

      if (
        currentIndex >= 0 &&
        currentIndex < this.numberOfQuestions.length - 1
      ) {
        this.activeButtonId = this.numberOfQuestions[currentIndex + 1].id;
        this.activeQuestion = this.questionSet.find(
          question => question.id === this.activeButtonId
        );
      } else {
        console.log('no more questions....');
      }
    }
  }
  private showPreventNavigationDialog(): void {
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
    this.ref?.onClose.subscribe(result => {
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

  private getPreventNavigationDialogData(): DialogData {
    return {
      message: `You are not allowed to navigate away from this page. Please complete the test.`,
      isChoice: false,
      closeOnNavigation: true,
    };
  }
}
