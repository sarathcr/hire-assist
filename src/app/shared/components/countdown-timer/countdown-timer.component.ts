import {
  Component,
  OnDestroy,
  OnInit,
  output,
  input,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrl: './countdown-timer.component.scss',
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  public timerHour = input.required<number | string>();

  public warningThresholds = input<number[]>([10, 5]);

  public warning = output<number>();
  public timeExpired = output<void>();
  public timeElapsed = output<number>();

  public timeLeft = signal<number>(0);
  public originalTimeSeconds = signal<number>(0);

  public isOvertime = computed(() => this.timeLeft() < 0);

  public displayTime = computed(() => {
    const val = Math.abs(this.timeLeft());

    const hours = Math.floor(val / 3600);
    const minutes = Math.floor((val % 3600) / 60);
    const seconds = val % 60;

    const formatted = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    return formatted;
  });

  private intervalId: any;
  private hasEmittedExpired = false;

  constructor() {
    effect(
      () => {
        const rawHour = this.timerHour();

        let totalSeconds = 0;

        if (typeof rawHour === 'string') {
          // Detect overtime from '+' prefix
          const isOvertime = rawHour.includes('+');
          const cleanHour = rawHour.replace('+', '').trim();
          
          // Parse HH:mm:ss
          const parts = cleanHour.split(':');
          const hours = parseInt(parts[0] || '0', 10);
          const minutes = parseInt(parts[1] || '0', 10);
          const seconds = parseInt(parts[2] || '0', 10);
          
          totalSeconds = hours * 3600 + minutes * 60 + seconds;
          
          if (isOvertime) {
            totalSeconds = -totalSeconds;
          }
        } else if (typeof rawHour === 'number') {
          const hours = Math.floor(rawHour);
          const minutes = Math.round((rawHour - hours) * 100);
          totalSeconds = hours * 3600 + minutes * 60;
        }

        this.timeLeft.set(totalSeconds);
        this.originalTimeSeconds.set(totalSeconds);
        this.hasEmittedExpired = false;
        this.startTimer();
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      this.timeLeft.update((time) => {
        const newTime = time - 1;

        if (newTime === 0 && !this.hasEmittedExpired) {
          this.timeExpired.emit();
          this.hasEmittedExpired = true;
        }

        if (newTime > 0) {
          this.checkWarning(newTime);
        }

        // Emit elapsed time
        this.timeElapsed.emit(this.originalTimeSeconds() - newTime);

        return newTime;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkWarning(timeLeftSeconds: number): void {
    const thresholds = this.warningThresholds();
    for (const threshold of thresholds) {
      if (timeLeftSeconds === threshold * 60) {
        this.warning.emit(threshold);
      }
    }
  }

  private pad(val: number): string {
    return val < 10 ? `0${val}` : `${val}`;
  }
}
