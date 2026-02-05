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
  public buttonLabelFromBackend = input<string | undefined>(); // Button label from backend
  public startTime = input<string>();
  public endTime = input<string>();
  public interviewDate = input<string>();
  public isPresent = input<boolean>(false);
  public assessmentRound = input<string>();
  public disable!: boolean;
  public showButton = false;
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
    // If button label is provided from backend, use it and skip time-based logic
    if (this.buttonLabelFromBackend() && this.buttonLabelFromBackend()!.trim() !== '') {
      this.buttonLabel = this.buttonLabelFromBackend()!;
      this.showButton = true;
      // Determine disable state based on status
      if (this.statusId() == this.status.Completed || this.isPreviousAssessment()) {
        this.disable = true;
      } else {
        this.disable = false;
      }
      return;
    }
    
    // Default: Show status name
    this.buttonLabel = this.getStatusLabel(this.statusId() ?? 0);
    this.showButton = true;
    this.disable = true;

    // Handle completed/previous
    if (this.statusId() == this.status.Completed || this.isPreviousAssessment()) {
       if (this.statusId() == this.status.Completed) {
         this.buttonLabel = 'Completed';
       } else if (this.isPreviousAssessment()) {
         this.buttonLabel = 'Closed';
       }
       return;
    }

    // Only check for time window if the status is scheduled
    if (this.statusId() === this.status.Scheduled || this.statusId() === this.status.Active) {
      const today = new Date();
      const startTimeStr = this.startTime() ?? '';
      const endTimeStr = this.endTime() ?? '';
      const assessmentDate = new Date(this.interviewDate() ?? '');
      
      // Try to parse as full datetime first, if that fails, combine with date
      let startDateTime = new Date(startTimeStr);
      let endDateTime = new Date(endTimeStr);
      
      // If parsing failed (invalid date), combine date with time string
      if (isNaN(startDateTime.getTime())) {
        startDateTime = this.combineDateAndTime(assessmentDate, startTimeStr);
      }
      
      if (isNaN(endDateTime.getTime())) {
        endDateTime = this.combineDateAndTime(assessmentDate, endTimeStr);
      }
  
      // Time window check
      if (today >= startDateTime && today <= endDateTime) {
        if (this.isPresent()) {
           this.buttonLabel = 'Start Assessment';
           this.disable = false;
        } else {
           this.buttonLabel = 'Absent';
           this.disable = true;
        }
      } else if (today > endDateTime) {
         this.buttonLabel = 'Closed';
         this.disable = true;
      }
    }
  }

  private getStatusLabel(statusId: number): string {
    return StatusEnum[statusId] || 'Unknown';
  }
  
  private combineDateAndTime(date: Date, timeStr: string): Date {
    const combined = new Date(date);
    
    if (!timeStr) {
      return combined;
    }
    
    // Try parsing time string as HH:MM:SS or HH:MM format
    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        combined.setHours(hours);
        combined.setMinutes(minutes);
        combined.setSeconds(seconds);
        combined.setMilliseconds(0);
      }
    }
    
    return combined;
  }
}
