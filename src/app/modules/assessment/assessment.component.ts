import { CommonModule, LocationStrategy } from '@angular/common';
import { Component, HostListener, inject, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { RadioButtonComponent } from '../../shared/components/radio-button/radio-button.component';
import { DialogConfig, DialogData } from '../../shared/models/dialog-models';
import { AssessmentWarningService } from '../../shared/services/assessment-warning.service';

@Component({
  selector: 'app-assessment',
  imports: [RadioButtonComponent, CommonModule],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.scss',
})
export class AssessmentComponent extends BaseComponent {
  // Signals
  public selectOption = output();
  // Private
  private isFullscreen = false;
  private isNavigationIntercepted = false;
  // Services
  private warningService = inject(AssessmentWarningService);

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private locationStrategy: LocationStrategy
  ) {
    super();
    this.enterFullScreenMode();
    this.locationStrategy.onPopState(() => {
      this.showPreventNavigationDialog();
    });
  }

  // Listener Events
  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    const warningCount = this.warningService.getWarningCount();

    if (warningCount > 2) {
      this.exitToCandidatePage();
      return;
    }

    const isCurrentlyFullscreen = !!document.fullscreenElement;

    if (this.isFullscreen && !isCurrentlyFullscreen) {
      console.log('Fullscreen exited. Re-entering fullscreen...');
      this.showWarningDialog();
    }

    this.isFullscreen = isCurrentlyFullscreen;
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

  public exitFullScreenMode(): void {
    // Check if the document is currently in fullscreen
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .then(() => {
          this.showTestTerminationDialog();
        })
        .catch(err => console.error('Failed to exit fullscreen mode:', err));
    } else {
      console.log('Not in fullscreen mode.');
    }
  }

  // Private Methods
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

    this.dialog
      .open(DialogComponent, {
        ...DialogConfig,
        data: modalData,
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.warningService.setWarningCount(1);
          this.enterFullScreenMode();
          this.dialog.closeAll();
        }
      });
  }

  private showPreventNavigationDialog(): void {
    const modalData: DialogData = this.getPreventNavigationDialogData();

    this.dialog
      .open(DialogComponent, {
        ...DialogConfig,
        data: modalData,
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.isNavigationIntercepted = false;
          console.log('Navigation prevented.');
          this.showWarningDialog();
        }
      });
  }

  private getWarningDialogData(): DialogData {
    return {
      title: 'Warning',
      message: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
      isChoice: true,
      closeOnNavigation: true,
    };
  }

  private getPreventNavigationDialogData(): DialogData {
    return {
      title: 'Warning',
      message: `You are not allowed to navigate away from this page. Please complete the test.`,
      isChoice: true,
      closeOnNavigation: true,
    };
  }

  private exitToCandidatePage(): void {
    this.exitFullScreenMode();
  }

  private showTestTerminationDialog() {
    const modalData: DialogData = this.getTestTerminationDialogData();

    this.dialog
      .open(DialogComponent, {
        ...DialogConfig,
        data: modalData,
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.router.navigate(['/candidate']);
        }
      });
  }

  private getTestTerminationDialogData(): DialogData {
    return {
      title: 'Sorry',
      message: `You have used your maximum attempts by exiting full screen mode. Please contact invigilator/HR for further information`,
      isChoice: false,
      closeOnNavigation: true,
    };
  }
}
