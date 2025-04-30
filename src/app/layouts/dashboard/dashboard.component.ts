import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { StoreService } from '../../shared/services/store.service';
import { SideNavComponent } from '../../shared/components/side-nav/side-nav.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, SideNavComponent, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  public links: MenuItem[] = [];

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    const userRole = this.storeService?.getUserRole();
    if (userRole) {
      switch (true) {
        case userRole.includes('admin'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/admin/dashboard'],
              routerLinkActiveOptions: { exact: true },
            },
            {
              label: 'Assessment',
              icon: 'pi pi-file-edit',
              routerLink: ['/admin/assessment'],
              routerLinkActiveOptions: { exact: false },
            },
            {
              label: 'Roles & Access',
              icon: 'pi pi-users',
              routerLink: ['/admin/roles-access'],
              routerLinkActiveOptions: { exact: true },
            },
            {
              label: 'Settings',
              icon: 'pi pi-cog',
              items: [
                {
                  label: 'questions',
                  icon: 'pi pi-file-check',
                  routerLink: ['/admin/settings/questions'],
                  routerLinkActiveOptions: { exact: true },
                },
                {
                  label: 'batches',
                  icon: 'pi pi-file-check',
                  routerLink: ['/admin/settings/batches'],
                  routerLinkActiveOptions: { exact: true },
                },
              ],
            },
          ];
          break;
        case userRole.includes('superadmin'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/admin/dashboard'],
              routerLinkActiveOptions: { exact: true },
            },
            {
              label: 'Roles & Access',
              icon: 'pi pi-users',
              routerLink: ['/admin/roles-access'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
          break;
        case userRole.includes('candidate'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/candidate/dashboard'],
              routerLinkActiveOptions: { exact: true },
            },
          ];
          break;
        case userRole.includes('interviewer'):
          this.links = [
            {
              label: 'Dashboard',
              icon: 'pi pi-home',
              routerLink: ['/interviewer'],
              routerLinkActiveOptions: { exact: true },
            },
            {
              label: 'Assessment',
              icon: 'pi pi-file-edit',
              routerLink: ['/interviewer/assessment'],
              routerLinkActiveOptions: { exact: false },
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
