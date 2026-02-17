import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CandidateData } from '../../../../../../models/stepper.model';

@Component({
  selector: 'app-round-completion-warning',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './round-completion-warning.component.html',
  styleUrl: './round-completion-warning.component.scss'
})
export class RoundCompletionWarningComponent {
  candidates: CandidateData[] = [];

  constructor(
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef
  ) {
    if (this.config.data && this.config.data.candidates) {
      this.candidates = this.config.data.candidates;
    }
  }

  close() {
    this.ref.close();
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
