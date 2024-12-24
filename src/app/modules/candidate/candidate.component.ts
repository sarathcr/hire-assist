import { Component, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BaseComponent } from '../../shared/components/base/base.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { DialogConfig, DialogData } from '../../shared/models/dialog-models';
import { AssessmentWarningService } from '../../shared/services/assessment-warning.service';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent, MatDialogModule],
  providers: [MatDialog],
  templateUrl: './candidate.component.html',
  styleUrl: './candidate.component.scss',
})
export class CandidateComponent extends BaseComponent {
  private warning = signal(0);

  warningService = inject(AssessmentWarningService);
  constructor(
    private dialog: MatDialog,
    private router: Router
  ) {
    super();
    effect(() => {
      console.log(this.warning());

      if (this.warning() <= 2) {
        this.requestFullScreen();
      }
    });
  }

  // Public Events
  public onAssessmentStart() {
    const modalData: DialogData = {
      title: 'Assessment instructions',
      message:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
      isChoice: true,
    };
    this.dialog
      .open(DialogComponent, {
        ...DialogConfig,
        data: { ...modalData },
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.router.navigate(['/candidate/test']);
          this.warning.update(val => val + 1);
        }
      });
  }

  private requestFullScreen() {
    const element = document.documentElement;
    element
      .requestFullscreen()
      .then(() => {
        console.log('Entered fullscreen mode.');
      })
      .catch(err => {
        console.error('Failed to enter fullscreen mode:', err);
      });
  }
}
