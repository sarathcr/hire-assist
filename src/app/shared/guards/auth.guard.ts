import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StoreService } from '../services/store.service';
import { RolesEnum } from '../enum/enum';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private roleNames: string[] = [];
  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.isAuthenticated();

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    // Extract required roles from route data
    const requiredRoles: RolesEnum[] = route.data['roles'];
    const userRoles = this.storeService.getUserRole();

    if (Array.isArray(requiredRoles) && requiredRoles.length > 0) {
      this.roleNames = requiredRoles
        .map(roleValue => RolesEnum[roleValue] as string) // Map numeric values to role names
        .filter(roleName => roleName) // Remove undefined/null values
        .map(roleName => roleName.toLowerCase()); // Convert to lowercase
    }

    // Check if the user has at least one required role
    if (
      this.roleNames &&
      userRoles &&
      !userRoles.some((role: string) => this.roleNames.includes(role))
    ) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
