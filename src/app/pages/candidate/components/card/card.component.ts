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
    const today = new Date();
    
    // Reset showButton
    this.showButton = false;
    this.disable = false;
    
    // Handle completed status
    if (this.statusId() == this.status.Completed) {
      this.buttonLabel = 'Completed';
      this.showButton = true;
      this.disable = true;
      return;
    }
    
    // Handle previous assessments
    if (this.isPreviousAssessment()) {
      this.buttonLabel = 'Closed';
      this.disable = true;
      this.showButton = true;
      return;
    }
    
    // For active assessments, parse start and end times
    // startTime and endTime should be full datetime strings or time strings
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
    
    // Compare current time with start/end datetime
    if (today < startDateTime) {
      // Current time is before start time - hide button
      this.showButton = false;
    } else if (today >= startDateTime && today <= endDateTime) {
      // Current time is between start and end time - show Start button
      this.buttonLabel = 'Start';
      this.showButton = true;
      this.disable = false;
    } else if (today > endDateTime) {
      // Current time is after end time - show Closed button
      this.buttonLabel = 'Closed';
      this.showButton = true;
      this.disable = true;
    }
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
