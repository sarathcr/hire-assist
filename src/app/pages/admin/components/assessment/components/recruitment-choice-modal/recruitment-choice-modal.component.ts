import { Component } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-recruitment-choice-modal',
  standalone: true,
  imports: [],
  templateUrl: './recruitment-choice-modal.component.html',
  styleUrl: './recruitment-choice-modal.component.scss'
})
export class RecruitmentChoiceModalComponent {
  constructor(public ref: DynamicDialogRef) {}

  public onChoice(choice: 'schedule' | 'detail'): void {
    this.ref.close(choice);
  }

  public onClose(): void {
    this.ref.close();
  }
}
