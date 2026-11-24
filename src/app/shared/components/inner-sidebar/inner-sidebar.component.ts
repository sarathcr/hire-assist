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

  private previousActiveMenuItem: number | undefined = undefined;
  private hasScrolledInitial = false;

  constructor() {
    super();
    effect(() => {
      const currentActive = this.activeMenuItem();
      const currentItems = this.items();
      const activeChanged =
        currentActive !== undefined &&
        currentActive !== this.previousActiveMenuItem;
      const initialLoad =
        !this.hasScrolledInitial &&
        currentActive !== undefined &&
        !!currentItems &&
        currentItems.length > 0;

      if (activeChanged || initialLoad) {
        this.previousActiveMenuItem = currentActive;
        if (currentItems && currentItems.length > 0) {
          this.hasScrolledInitial = true;
        }
        this.scrollToActiveItem();
      }
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
      const menuEl = this.elementRef.nativeElement.querySelector('.p-menu') as HTMLElement;
      const activeEl = this.elementRef.nativeElement.querySelector(
        '.p-menu-item-link.active, .inner-sidebar__btn-item.active'
      ) as HTMLElement;
      if (menuEl && activeEl && menuEl.scrollWidth > menuEl.clientWidth) {
        const menuRect = menuEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const targetScrollLeft =
          menuEl.scrollLeft +
          (activeRect.left - menuRect.left) -
          menuEl.clientWidth / 2 +
          activeRect.width / 2;
        if (typeof menuEl.scrollTo === 'function') {
          menuEl.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth',
          });
        } else {
          menuEl.scrollLeft = Math.max(0, targetScrollLeft);
        }
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
