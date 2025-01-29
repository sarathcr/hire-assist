import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SideNavComponent } from '../../shared/components/side-nav/side-nav.component';

import { MenuItem } from 'primeng/api';
import { StoreService } from '../../shared/services/store.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [SideNavComponent, HeaderComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent implements OnInit {
  public links: MenuItem[] | undefined;
  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    const userRole = this.storeService.getUserRole();
    if (userRole) {
      switch (true) {
        case userRole.includes('admin'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/admin'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
          break;
        case userRole.includes('superadmin'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/admin'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
          break;
        case userRole.includes('candidate'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/candidate'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
          break;
        default:
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/candidate'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
      }
    } else {
      this.links = [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/candidate'],
          routerLinkActiveOptions: { exact: true },
        },
      ];
    }
  }
}
