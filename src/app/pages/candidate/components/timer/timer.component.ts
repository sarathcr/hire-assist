import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
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
export class TimerComponent {
  public config: CountdownConfig = {
    leftTime: 3600,
    format: 'HH:mm:ss',
    notify: [1800, 300],
  };
  constructor(private cdr: ChangeDetectorRef) {}
  public timerClass = '';
  public displayString!: string;
  @ViewChild('cd', { static: false }) private countdown!: CountdownComponent;
  public handleEvent(event: CountdownEvent): void {
    if (event.action === 'notify') {
      this.timerClass =
        event.left === 1800000
          ? 'timer_half-time'
          : event.left === 300000
            ? 'timer_almost-over'
            : '';
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
    this.config = {
      ...this.config,
      leftTime: seconds,
      format: 'HH:mm:ss',
      notify: [1800, 300],
    };
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.countdown) {
        this.countdown.restart();
      }
    }, 0);
  }
}
