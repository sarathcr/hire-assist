import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RippleModule } from 'primeng/ripple';
import { ToggleMenuService } from '../../services/toggle-menu.service';

@Component({
  selector: 'app-side-nav',
  imports: [
    MenuModule,
    BadgeModule,
    RippleModule,
    AvatarModule,
    CommonModule,
    PanelMenuModule,
  ],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  public items: MenuItem[] | undefined;
  public toggleMenu = inject(ToggleMenuService);
  public showMenu = computed(() => this.toggleMenu.getToggleMenu());
  @Input() public navLinks: MenuItem[] | undefined;

  // Public methods
  public closeToggleMenu() {
    this.toggleMenu.setToggleMenu(false);
  }
}
