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
  public isFutureTest = false;
  public countdownText = '';
  public disable!: boolean;
  public showButton = false;
  public intervalId!: NodeJS.Timeout;

  ngOnInit(): void {
    this.assessmentStatus();
    this.intervalId = setInterval(() => {
      this.assessmentStatus();
    }, 1000);
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
    // 1. Handle completed/previous
    if (
      this.statusId() == this.status.Completed ||
      this.isPreviousAssessment()
    ) {
      if (
        this.isPreviousAssessment() &&
        (this.statusId() == this.status.Scheduled ||
          this.statusId() == this.status.Active)
      ) {
        this.buttonLabel = 'Missed';
      } else {
        this.buttonLabel = this.getStatusLabel(this.statusId() ?? 0);
      }
      this.showButton = true;
      this.disable = true;
      this.isFutureTest = false;
      this.countdownText = '';
      return;
    }

    const today = new Date();
    const startTimeStr = this.startTime() ?? '';
    const endTimeStr = this.endTime() ?? '';
    const assessmentDate = this.parseDateSafely(this.interviewDate() ?? '');

    // Try to parse as full datetime first, if that fails, combine with date
    let startDateTime = this.parseDateSafely(startTimeStr);
    let endDateTime = this.parseDateSafely(endTimeStr);

    // If parsing failed (invalid date), combine date with time string
    if (isNaN(startDateTime.getTime())) {
      startDateTime = this.combineDateAndTime(assessmentDate, startTimeStr);
    }

    if (isNaN(endDateTime.getTime())) {
      endDateTime = this.combineDateAndTime(assessmentDate, endTimeStr);
    }

    // If the assessment was scheduled outside the batch end time, 
    // override the time window so the candidate can still take it.
    if (!isNaN(assessmentDate.getTime()) && assessmentDate > endDateTime) {
      startDateTime = new Date(assessmentDate);
      endDateTime = new Date(assessmentDate);
      endDateTime.setHours(23, 59, 59, 999);
    }

    // 2. Enforce Future Start Time Limit (Show countdown and keep button disabled)
    if (!isNaN(assessmentDate.getTime()) && today < assessmentDate) {
      const diff = assessmentDate.getTime() - today.getTime();
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h`;
      } else {
        const pad = (n: number) => n.toString().padStart(2, '0');
        timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      this.isFutureTest = true;
      this.countdownText = timeString;
      this.buttonLabel = 'Upcoming';
      this.showButton = true;
      this.disable = true;
      return;
    }

    this.isFutureTest = false;
    this.countdownText = '';

    // 3. If button label is provided from backend, use it and skip time-based logic
    if (this.buttonLabelFromBackend() && this.buttonLabelFromBackend()!.trim() !== '') {
      this.buttonLabel = this.buttonLabelFromBackend()!;
      this.showButton = true;
      this.disable = false;
      return;
    }

    // 4. Default: Show status name
    this.buttonLabel = this.getStatusLabel(this.statusId() ?? 0);
    this.showButton = true;
    this.disable = true;

    // 5. Time window check
    if (
      this.statusId() == this.status.Scheduled ||
      this.statusId() == this.status.Active
    ) {
      if (today >= startDateTime && today <= endDateTime) {
        if (this.isPresent()) {
          this.buttonLabel = 'Start Assessment';
          this.disable = false;
        } else {
          this.buttonLabel = 'Absent';
          this.disable = true;
        }
      } else if (today > endDateTime) {
        this.buttonLabel = this.getStatusLabel(this.statusId() ?? 0);
        this.disable = true;
      }
    }
  }

  private getStatusLabel(statusId: number): string {
    if (statusId === this.status.NotAttended) {
      return 'Not Attended';
    }
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

  private parseDateSafely(dateStr: string): Date {
    if (!dateStr) return new Date('');
    
    const normalized = dateStr.trim();
    const parts = normalized.split(/[\sT]+/);
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '';
    const ampmPart = parts.length > 2 ? parts[2] : '';

    const dateSeparators = datePart.includes('-') ? '-' : datePart.includes('/') ? '/' : '';
    if (dateSeparators) {
      const dateParts = datePart.split(dateSeparators);
      if (dateParts.length === 3 && dateParts[0].length <= 2 && dateParts[2].length === 4) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);

        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        if (timePart) {
          const timeParts = timePart.split(':');
          hours = parseInt(timeParts[0], 10);
          minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
          seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

          if (ampmPart && ampmPart.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
          } else if (ampmPart && ampmPart.toLowerCase().includes('am') && hours === 12) {
            hours = 0;
          } else if (timePart.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
          } else if (timePart.toLowerCase().includes('am') && hours === 12) {
            hours = 0;
          }
        }

        return new Date(year, month, day, hours, minutes, seconds);
      }
    }

    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      d = new Date(dateStr.replace(/-/g, '/').replace('T', ' ').split('.')[0]);
    }
    return d;
  }
}
