import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { DropDownComponent } from '../drop-down/drop-down.component';
import { SidebarCollapseService } from '../../services/sidebar-collapse.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, DropDownComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  constructor(public router: Router) {}

  toggleMenu = inject(ToggleMenuService);
  sidebarCollapse = inject(SidebarCollapseService);
  public isMobile = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  ngOnInit() {
    this.checkMobileView();
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  public onMenuClick() {
    // On mobile/tablet, only toggle the menu overlay
    // On desktop, also toggle collapse
    if (this.isMobile) {
      this.toggleMenu.setToggleMenu(true);
    } else {
      this.toggleMenu.setToggleMenu(true);
      // Desktop collapse is handled separately via the collapse button
    }
  }

  public closeMenu() {
    this.toggleMenu.setToggleMenu(false);
  }

  public isMenuOpen(): boolean {
    return this.toggleMenu.getToggleMenu();
  }

  public toggleSidebarCollapse() {
    // Only allow collapse on desktop
    if (!this.isMobile) {
      this.sidebarCollapse.toggle();
    }
  }
}
