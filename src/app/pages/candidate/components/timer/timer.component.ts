import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
  public timerClass = '';
  @ViewChild('cd', { static: false }) private countdown!: CountdownComponent;

  public handleEvent(event: CountdownEvent): void {
    console.log(event);
    if (event.action === 'notify') {
      this.timerClass =
        event.left === 1800000
          ? 'timer_half-time'
          : event.left === 300000
            ? 'timer_almost-over'
            : '';
    }
  }
}
