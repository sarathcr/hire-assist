import { Component, input, OnDestroy, OnInit, output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatusEnum } from '../../../../shared/enums/status.enum';

@Component({
  selector: 'app-card',
  imports: [ButtonComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnInit, OnDestroy {
  public startTest = output();
  public isDisabled = input<boolean>();
  public statusId = input<number>();
  public isPreviousAssessment = input<boolean>();
  public status = StatusEnum;
  public buttonLabel!: string;
  public startTime = input<string>();
  public endTime = input<string>();
  public interviewDate = input<string>();
  public disable!: boolean;
  public intervalId!: NodeJS.Timeout;

  ngOnInit(): void {
    this.assessmentStatus();
    this.intervalId = setInterval(() => {
      this.assessmentStatus();
    }, 30000);
  }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Public Events
  public startAssessment() {
    this.startTest.emit();
  }

  private assessmentStatus() {
    const end = new Date(this.endTime() ?? '');
    const start = new Date(this.startTime() ?? '');
    const dateOnly = new Date(this.interviewDate() ?? '');
    const today = new Date();
    if (this.statusId() == this.status.Completed) {
      this.buttonLabel = 'Completed';
      return;
    }
    if (
      this.statusId() != this.status.Completed &&
      this.isPreviousAssessment()
    ) {
      this.buttonLabel = 'Closed';
      this.disable = true;
    }
    if (!this.isPreviousAssessment() && today >= start && today <= end) {
      this.buttonLabel = 'Start';
    }
    if (
      dateOnly.getFullYear() === today.getFullYear() &&
      dateOnly.getMonth() === today.getMonth() &&
      dateOnly.getDate() === today.getDate()
    ) {
      if (today >= end) {
        this.buttonLabel = 'Closed';
        this.disable = true;
      }
      if (today >= end && this.statusId() == this.status.Completed) {
        this.buttonLabel = 'Completed';
        this.disable = true;
      }
      if (today < start) {
        this.disable = true;
      }
    }
  }
}
