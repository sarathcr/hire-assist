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
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';
import { DialogData } from '../../shared/models/dialog-models';
import { AssessmentWarningService } from '../../shared/services/assessment-warning.service';
import { DialogFooterComponent } from '../../shared/components/dialog-footer/dialog-footer.component';

@Component({
  selector: 'app-assessment',
  imports: [RadioButtonComponent, CommonModule],
  providers: [DialogService],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  private warningService = inject(AssessmentWarningService);
  public isFullScreen = false;
  // Signals
  public selectOption = output();
  public isNavigationIntercepted = false;
  // Private
  private warningCount!: number;

  // Services

  public ref: DynamicDialogRef | undefined;

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
  }

  ngOnInit(): void {
    if (this.warningCount == 2) {
      this.showTestTerminationDialog();
    } else this.enterFullScreenMode();
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
      this.showWarningDialog();
    }
  }

  // Public Events
  public onOptionSelect(): void {
    this.selectOption.emit();
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
        this.showWarningDialog();
        this.ref?.close();
      }
    });
  }

  private getPreventNavigationDialogData(): DialogData {
    return {
      message: `You are not allowed to navigate away from this page. Please complete the test.`,
      isChoice: true,
      closeOnNavigation: true,
    };
  }
}
