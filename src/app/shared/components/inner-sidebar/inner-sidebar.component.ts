import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, effect, inject, input, output } from '@angular/core';
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
  private elementRef = inject(ElementRef);

  public showMenu = true;

  public activeMenuItem = input<number>();
  public items = input<MenuItem[]>();
  public title = input<string>('Settings');
  public icon = input<string>('pi pi-cog');
  public itemClick = output<MenuItem>();

  constructor() {
    super();
    effect(() => {
      // Re-trigger scroll when activeMenuItem or items change
      this.activeMenuItem();
      this.items();
      this.scrollToActiveItem();
    });
  }

  @HostListener('wheel', ['$event'])
  public onWheel(event: WheelEvent): void {
    const menuEl = this.elementRef.nativeElement.querySelector('.p-menu') as HTMLElement;
    if (!menuEl) return;

    // Only handle horizontal scrolling when the menu container has horizontal overflow
    if (menuEl.scrollWidth > menuEl.clientWidth) {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        menuEl.scrollLeft += event.deltaY;
      }
    }
  }

  public scrollToActiveItem(): void {
    setTimeout(() => {
      const activeEl = this.elementRef.nativeElement.querySelector(
        '.p-menu-item-link.active, .inner-sidebar__btn-item.active'
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, 100);
  }

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
