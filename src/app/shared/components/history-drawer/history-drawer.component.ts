import { CommonModule } from '@angular/common';
import { Component, Input, model, output, ViewEncapsulation } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Timeline, TimelineModule } from 'primeng/timeline';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

export interface HistoryEvent {
  status: string;
  user: string;
  date: string | Date;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-history-drawer',
  imports: [CommonModule, DrawerModule, Timeline, TimelineModule, ProgressSpinnerModule],
  templateUrl: './history-drawer.component.html',
  styleUrl: './history-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HistoryDrawerComponent {
  public visible = model<boolean>(false);
  @Input() events: HistoryEvent[] = [];
  @Input() header: string = 'History';
  @Input() showLoadMore: boolean = false;
  @Input() loading: boolean = false;
  public loadMore = output<void>();
}
