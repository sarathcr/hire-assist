import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SideNavComponent } from '../../shared/components/side-nav/side-nav.component';
import { SidebarCollapseService } from '../../shared/services/sidebar-collapse.service';
import { StoreService } from '../../shared/services/store.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, SideNavComponent, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  public links: MenuItem[] = [];
  private collapseService = inject(SidebarCollapseService);
  public collapsed = computed(() => this.collapseService.isCollapsed());
  constructor(private readonly storeService: StoreService) {}

  ngOnInit(): void {
    const userRole = this.storeService?.getUserRole();
    if (userRole) {
      if (userRole.includes('admin') || userRole.includes('superadmin')) {
        this.links = this.getAdminLinks(userRole);
      } else if (userRole.includes('candidate')) {
        this.links = this.getCandidateLinks();
      } else if (userRole.includes('interviewer')) {
        this.links = this.getInterviewerLinks(userRole);
      } else if (userRole.includes('coordinator')) {
        this.links = this.getCoordinatorLinks(userRole);
      } else if (userRole.includes('frontdesk')) {
        this.links = this.getFrontdeskLinks(userRole);
      } else {
        this.links = this.getDefaultLinks();
      }
    } else {
      this.links = this.getDefaultLinks();
    }
  }

  private getAdminLinks(userRole: string[]): MenuItem[] {
    const links: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/admin/dashboard'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Dashboard',
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/admin/recruitments'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Recruitments',
      },
      {
        label: 'Roles & Access',
        icon: 'pi pi-users',
        routerLink: ['/admin/roles-access'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Roles & Access',
      },
    ];
    if (userRole.includes('interviewer')) {
      links.push({
        label: 'Interviews',
        icon: 'pi pi-calendar',
        routerLink: ['/admin/interviews'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Interviews',
      });
    }
    if (userRole.includes('coordinator')) {
      links.push({
        label: 'Coordinator',
        icon: 'pi pi-sitemap',
        routerLink: ['/admin/coordinator'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Coordinator',
      });
    }
    if (userRole.includes('frontdesk')) {
      links.push({
        label: 'Frontdesk',
        icon: 'pi pi-home',
        routerLink: ['/frontdesk'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Frontdesk',
      });
    }
    // Append Settings as the last menu item
    links.push({
      label: 'Settings',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Questions',
          icon: 'pi pi-file-check',
          routerLink: ['/admin/settings/questions'],
          routerLinkActiveOptions: { exact: true },
        },
        {
          label: 'Batches',
          icon: 'pi pi-list',
          routerLink: ['/admin/settings/batches'],
          routerLinkActiveOptions: { exact: true },
        },
        {
          label: 'Departments',
          icon: 'pi pi-database',
          routerLink: ['/admin/settings/departments'],
          routerLinkActiveOptions: { exact: true },
        },
        {
          label: 'Panels',
          icon: 'pi pi-clone',
          routerLink: ['/admin/settings/panels'],
          routerLinkActiveOptions: { exact: true },
        },
        {
          label: 'Panel Assignment',
          icon: 'pi pi-user-plus',
          routerLink: ['/admin/settings/interviewerPanel'],
          routerLinkActiveOptions: { exact: true },
        },
      ],
    });
    return links;
  }

  private getCandidateLinks(): MenuItem[] {
    return [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/candidate'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Dashboard',
      },
    ];
  }

  private getInterviewerLinks(userRole: string[]): MenuItem[] {
    const links: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/interviewer'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Dashboard',
      },
    ];
    if (userRole.includes('coordinator')) {
      links.push({
        label: 'Coordinator',
        icon: 'pi pi-sitemap',
        routerLink: ['/admin/coordinator'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Coordinator',
      });
    }
    if (userRole.includes('frontdesk')) {
      links.push({
        label: 'Frontdesk',
        icon: 'pi pi-home',
        routerLink: ['/frontdesk'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Frontdesk',
      });
    }
    return links;
  }

  private getCoordinatorLinks(userRole: string[]): MenuItem[] {
    const links: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/coordinator'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Dashboard',
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/coordinator/recruitments'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Recruitments',
      },
    ];
    if (userRole.includes('interviewer')) {
      links.push({
        label: 'Interviewer',
        icon: 'pi pi-calendar',
        routerLink: ['/admin/interviews'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Interviewer',
      });
    }
    if (userRole.includes('frontdesk')) {
      links.push({
        label: 'Frontdesk',
        icon: 'pi pi-home',
        routerLink: ['/frontdesk'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Frontdesk',
      });
    }
    return links;
  }

  private getFrontdeskLinks(userRole: string[]): MenuItem[] {
    const links: MenuItem[] = [
      {
        label: 'Recruitments',
        icon: 'pi pi-home',
        routerLink: ['/frontdesk'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Recruitments',
      },
    ];
    if (userRole.includes('coordinator')) {
      links.push({
        label: 'Coordinator',
        icon: 'pi pi-sitemap',
        routerLink: ['/admin/coordinator'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Coordinator',
      });
    }
    if (userRole.includes('interviewer')) {
      links.push({
        label: 'Interviewer',
        icon: 'pi pi-calendar',
        routerLink: ['/admin/interviews'],
        routerLinkActiveOptions: { exact: false },
        tooltip: 'Interviewer',
      });
    }
    return links;
  }

  private getDefaultLinks(): MenuItem[] {
    return [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/candidate'],
        routerLinkActiveOptions: { exact: true },
        tooltip: 'Dashboard',
      },
    ];
  }
}
