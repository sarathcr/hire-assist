import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CandidateData } from '../../../../../../models/stepper.model';
import { ButtonComponent } from '../../../../../../../../shared/components/button/button.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-force-complete-warning',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, ButtonComponent],
  templateUrl: './force-complete-warning.component.html',
  styleUrl: './force-complete-warning.component.scss'
})
export class ForceCompleteWarningComponent {
  candidates: any[] = [];
  roundName: string = '';
  isSaving: boolean = false;

  constructor(
    public config: DynamicDialogConfig,
    public ref: DynamicDialogRef
  ) {
    if (this.config.data) {
      this.candidates = this.config.data.candidates || [];
      this.roundName = this.config.data.roundName || '';
    }
  }

  cancel() {
    this.ref.close(false);
  }

  proceed() {
    if (this.config.data?.onProceed) {
      this.isSaving = true;
      this.config.data.onProceed(this.candidates).subscribe({
        next: () => {
          this.isSaving = false;
          this.ref.close(true);
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.ref.close(this.candidates);
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
