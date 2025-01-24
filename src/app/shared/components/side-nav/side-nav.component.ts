import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { ToggleMenuService } from '../../services/toggle-menu.service';

@Component({
  selector: 'app-side-nav',
  imports: [MenuModule, BadgeModule, RippleModule, AvatarModule, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  items: MenuItem[] | undefined;
  toggleMenu = inject(ToggleMenuService);
  public showMenu = computed(() => this.toggleMenu.getToggleMenu());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public navLinks: any = input();

  constructor() {
    effect(() => {
      console.log(this.navLinks());
    });
  }

  public closeToggleMenu() {
    this.toggleMenu.setToggleMenu(false);
  }
}
