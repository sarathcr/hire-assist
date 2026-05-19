import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs$: Observable<MenuItem[]>;
  home: MenuItem;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    private storeService: StoreService
  ) {
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
    this.home = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };
  }

  ngOnInit(): void {
    this.setHomeRoute(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setHomeRoute(event.urlAfterRedirects);
      });
  }

  private setHomeRoute(url: string): void {
    if (url.startsWith('/admin')) {
      this.home = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };
    } else if (url.startsWith('/interviewer')) {
      this.home = { icon: 'pi pi-home', routerLink: '/interviewer' };
    } else if (url.startsWith('/coordinator')) {
      this.home = { icon: 'pi pi-home', routerLink: '/coordinator' };
    } else if (url.startsWith('/candidate')) {
      this.home = { icon: 'pi pi-home', routerLink: '/candidate' };
    } else if (url.startsWith('/frontdesk')) {
      this.home = { icon: 'pi pi-home', routerLink: '/frontdesk' };
    } else if (url.startsWith('/profile')) {
      this.home = { icon: 'pi pi-home', routerLink: this.getDashboardRoute() };
    } else {
      this.home = { icon: 'pi pi-home', routerLink: '/' };
    }
  }

  private getDashboardRoute(): string {
    const userRole = this.storeService.getUserRole();

    if (userRole?.includes('admin') || userRole?.includes('superadmin')) {
      return '/admin/dashboard';
    }

    if (userRole?.includes('candidate')) {
      return '/candidate';
    }

    if (userRole?.includes('interviewer')) {
      return '/interviewer';
    }

    if (userRole?.includes('coordinator')) {
      return '/coordinator';
    }

    if (userRole?.includes('frontdesk')) {
      return '/frontdesk';
    }

    return '/admin/dashboard';
  }
}
