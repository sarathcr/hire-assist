import { Component } from '@angular/core';
import { CardComponent } from '../../shared/components/card/card.component';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { BaseComponent } from '../../shared/components/base/base.component';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-candidate',
  imports: [CardComponent, MatDialogModule],
  providers: [DialogService],
  templateUrl: './candidate.component.html',
  styleUrl: './candidate.component.scss',
})
export class CandidateComponent extends BaseComponent {
  constructor(private dialogService: DialogService) {
    super();
  }

  // Public Events
  public onAssessmentStart() {
    const sub = this.dialogService
      .openDialog(
        {
          title: 'Detalle cliente',
          message:
            'Si cancelas la operación perderás todos los datos introducidos',
          isChoice: true,
        },
        DialogComponent
      )
      .subscribe();
    this.subscriptionList.push(sub);
  }
}
