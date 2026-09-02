import { inject, Injectable, signal, effect } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToggleMenuService {
  private router = inject(Router, { optional: true });
  private toggleMenu = signal(false);

  constructor() {
    effect(() => {
      const isOpen = this.toggleMenu();
      if (typeof document !== 'undefined') {
        if (isOpen && window.innerWidth <= 1024) {
          document.body.classList.add('mobile-sidebar-open');
        } else {
          document.body.classList.remove('mobile-sidebar-open');
        }
      }
    });

    this.router?.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setToggleMenu(false);
      });
  }

  public setToggleMenu(state: boolean) {
    this.toggleMenu.set(state);
  }

  public getToggleMenu() {
    return this.toggleMenu();
  }
}
