import { CommonModule } from '@angular/common';
import { Component, input, model, ViewEncapsulation } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Timeline, TimelineModule } from 'primeng/timeline';

export interface HistoryEvent {
  status: string;
  user: string;
  date: string;
  icon: string;
}

@Component({
  selector: 'app-history-drawer',
  imports: [CommonModule, DrawerModule, Timeline, TimelineModule],
  templateUrl: './history-drawer.component.html',
  styleUrl: './history-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HistoryDrawerComponent {
  public visible = model<boolean>(false);
  public events = input<HistoryEvent[]>([]);
  public header = input<string>('History');
}
