import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';
import { InnerSidebarComponent } from '../../../../shared/components/inner-sidebar/inner-sidebar.component';

@Component({
  selector: 'app-settings',
  imports: [RouterOutlet, InnerSidebarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public activeMenuItem = 0;
  public pageTitle = 'Questions';

  public settingsMenuItems: MenuItem[] = [
    {
      label: 'Assessment',
      items: [
        {
          label: 'Questions',
          icon: 'pi pi-file-check',
          route: '/admin/settings/questions',
          routerLink: ['/admin/settings/questions'],
          index: 0,
        },
        {
          label: 'Question Types',
          icon: 'pi pi-tags',
          route: '/admin/settings/question-types',
          routerLink: ['/admin/settings/question-types'],
          index: 1,
        },
        {
          label: 'Aptitude Test Instructions',
          icon: 'pi pi-book',
          route: '/admin/settings/instructions',
          routerLink: ['/admin/settings/instructions'],
          index: 6,
        },
      ],
    },
    {
      label: 'Interview Management',
      items: [
        {
          label: 'Batches',
          icon: 'pi pi-calendar',
          route: '/admin/settings/batches',
          routerLink: ['/admin/settings/batches'],
          index: 2,
        },
        {
          label: 'Panels',
          icon: 'pi pi-clone',
          route: '/admin/settings/panels',
          routerLink: ['/admin/settings/panels'],
          index: 3,
        },
        {
          label: 'Panel Assignment',
          icon: 'pi pi-user-plus',
          route: '/admin/settings/panel-assignment',
          routerLink: ['/admin/settings/panel-assignment'],
          index: 4,
        },
      ],
    },
    {
      label: 'Organization',
      items: [
        {
          label: 'Departments',
          icon: 'pi pi-building',
          route: '/admin/settings/departments',
          routerLink: ['/admin/settings/departments'],
          index: 5,
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.updateActiveMenuItem(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.updateActiveMenuItem(event.urlAfterRedirects);
      });
  }

  private updateActiveMenuItem(url: string): void {
    if (url.includes('/admin/settings/instructions')) {
      this.activeMenuItem = 6;
      this.pageTitle = 'Aptitude Test Instructions';
    } else if (url.includes('/admin/settings/departments')) {
      this.activeMenuItem = 5;
      this.pageTitle = 'Departments';
    } else if (url.includes('/admin/settings/panel-assignment')) {
      this.activeMenuItem = 4;
      this.pageTitle = 'Assign Panel';
    } else if (url.includes('/admin/settings/panels')) {
      this.activeMenuItem = 3;
      this.pageTitle = 'Panels';
    } else if (url.includes('/admin/settings/batches')) {
      this.activeMenuItem = 2;
      this.pageTitle = 'Batches';
    } else if (url.includes('/admin/settings/question-types')) {
      this.activeMenuItem = 1;
      this.pageTitle = 'Question Types';
    } else if (url.includes('/admin/settings/questions')) {
      this.activeMenuItem = 0;
      this.pageTitle = 'Questions';
    } else {
      this.activeMenuItem = 0;
      this.pageTitle = 'Questions';
    }
  }
}
