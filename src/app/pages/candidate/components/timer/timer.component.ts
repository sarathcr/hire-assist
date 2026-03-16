import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import {
  CountdownComponent,
  CountdownConfig,
  CountdownEvent,
  CountdownModule,
} from 'ngx-countdown';

@Component({
  selector: 'app-timer',
  imports: [CountdownModule, CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent implements OnDestroy {
  public config: CountdownConfig = {
    leftTime: 3600,
    format: 'HH:mm:ss',
    notify: [600, 300],
  };
  
  public timerClass = '';
  @ViewChild('cd', { static: false }) private countdown!: CountdownComponent;

  @Output() notifyWarning = new EventEmitter<number>();
  @Output() timesUp = new EventEmitter<string>();

  constructor(private cdr: ChangeDetectorRef) {}

  private pollInterval: any;
  private isTimeUpEmitted = false;

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  

  public handleEvent(event: CountdownEvent): void {
    if (event.action === 'notify') {
      const remainingSeconds = Math.round(event.left / 1000);
      this.timerClass =
        remainingSeconds === 600
          ? 'timer_half-time'
          : remainingSeconds === 300
            ? 'timer_last-minutes'
            : '';

      if (remainingSeconds === 600) {
        this.notifyWarning.emit(10);
      } else if (remainingSeconds === 300) {
        this.notifyWarning.emit(5);
      }
    }

    if (event.action === 'done' ) {
      console.log('TimerComponent: Time up event detected', event);
      this.timesUp.emit(event.action);
    }
  }

  public getCurrentFormattedTime(): string {
    if (!this.countdown || this.countdown.left == null) return '00:00:00';

    const totalSeconds = Math.floor(this.countdown.left / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  public setInitialTime(seconds: number): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.isTimeUpEmitted = false;

    if (seconds <= 0) {
      this.isTimeUpEmitted = true;
      setTimeout(() => {
        this.timesUp.emit();
      }, 0);
      return;
    }

    this.config = {
      ...this.config,
      leftTime: seconds,
      notify: [600, 300],
    };
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.countdown) {
        this.countdown.restart();
      }

      // Check every second as a fallback
      this.pollInterval = setInterval(() => {
        if (!this.countdown || this.countdown.left == null) return;
        const totalSeconds = Math.floor(this.countdown.left / 1000);

        if (totalSeconds <= 0 && !this.isTimeUpEmitted) {
          console.log('TimerComponent: Time up detected via polling');
          this.isTimeUpEmitted = true;
          clearInterval(this.pollInterval);
          this.timesUp.emit();
        }
      }, 1000);
    }, 0);
  }
}
