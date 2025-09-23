import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
export class SideNavComponent implements OnChanges {
  public items: MenuItem[] | undefined;
  public toggleMenu = inject(ToggleMenuService);
  public showMenu = computed(() => this.toggleMenu.getToggleMenu());
  public navLinkInterceptor: MenuItem[] = [];
  @Input() public navLinks: MenuItem[] | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['navLinks'] && changes['navLinks']?.currentValue) {
      const currentNavLinks = JSON.parse(JSON.stringify(this.navLinks));
      this.onNavLinkClick(currentNavLinks);
      this.navLinkInterceptor = currentNavLinks;
    }
  }
  // Public methods
  public closeToggleMenu() {
    this.toggleMenu.setToggleMenu(false);
  }
  private onNavLinkClick(links: MenuItem[]) {
    for (const link of links) {
      if (link.routerLink && link['hasRouterLink'] !== false) {
        link.command = () => {
          this.closeToggleMenu();
        };
      }
      if (link.items && link.items.length > 0) {
        this.onNavLinkClick(link.items);
      }
    }
  }
}
