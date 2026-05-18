import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly _breadcrumbs$ = new BehaviorSubject<MenuItem[]>([]);
  readonly breadcrumbs$ = this._breadcrumbs$.asObservable();

  private labelOverrides: { [key: string]: string } = {};

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });
  }

  /**
   * Override a static breadcrumb label with a dynamic one.
   * @param key The static label defined in the route config (e.g., 'Recruitment Details')
   * @param label The new dynamic label (e.g., 'Software Engineer Recruitment')
   */
  setLabel(key: string, label: string) {
    this.labelOverrides[key] = label;
    this.updateBreadcrumbs();
  }

  /**
   * Reset all dynamic overrides.
   */
  resetLabels() {
    this.labelOverrides = {};
    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs() {
    const root = this.router.routerState.snapshot.root;
    const breadcrumbs: MenuItem[] = [];
    this.addBreadcrumb(root, [], breadcrumbs);

    // Automatically disable the last item (current page)
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].disabled = true;
    }

    this._breadcrumbs$.next(breadcrumbs);
  }

  private addBreadcrumb(
    route: ActivatedRouteSnapshot,
    parentUrl: string[],
    breadcrumbs: MenuItem[]
  ) {
    if (route) {
      const routeUrl = parentUrl.concat(route.url.map((url) => url.path));

      const staticLabel = route.routeConfig?.data?.['breadcrumb'];
      const isDisabled = route.routeConfig?.data?.['breadcrumbDisabled'];

      if (staticLabel) {
        const breadcrumb: MenuItem = {
          label: this.labelOverrides[staticLabel] || staticLabel,
          routerLink: '/' + routeUrl.join('/'),
          disabled: isDisabled,
        };
        breadcrumbs.push(breadcrumb);
      }

      if (route.firstChild) {
        this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
      }
    }
  }
}
