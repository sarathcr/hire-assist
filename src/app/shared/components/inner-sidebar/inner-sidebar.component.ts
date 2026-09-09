import { CommonModule, NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem, SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-inner-sidebar',
  imports: [CommonModule, Menu, RouterLink, ButtonModule, NgClass, TooltipModule, SharedModule],
  templateUrl: './inner-sidebar.component.html',
  styleUrl: './inner-sidebar.component.scss',
})
export class InnerSidebarComponent extends BaseComponent {
  public showMenu = true;

  public activeMenuItem = input<number>();
  public items = input<MenuItem[]>();
  public title = input<string>('Settings');
  public icon = input<string>('pi pi-cog');
  public itemClick = output<MenuItem>();

  public onItemClick(event: Event, item: MenuItem): void {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    if (item.command) {
      item.command({ originalEvent: event, item });
    }
    this.itemClick.emit(item);
  }
}
