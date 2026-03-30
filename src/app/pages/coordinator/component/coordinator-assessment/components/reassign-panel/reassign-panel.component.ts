import { Component } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reassign-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './reassign-panel.component.html',
  styleUrl: './reassign-panel.component.scss'
})
export class ReassignPanelComponent {
  reassignCandidateName: string = '';

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    if (this.config.data) {
      this.reassignCandidateName = this.config.data.candidateName || '';
    }
  }

  confirm(): void {
    this.ref.close(true);
  }

  cancel(): void {
    this.ref.close(false);
  }
}
