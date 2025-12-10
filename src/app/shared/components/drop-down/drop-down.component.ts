import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-drop-down',
  imports: [Menu, ButtonModule],
  templateUrl: './drop-down.component.html',
  styleUrl: './drop-down.component.scss',
})
export class DropDownComponent implements OnInit {
  items: MenuItem[] | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}
  ngOnInit() {
    this.items = [
      {
        items: [
          {
            label: 'Profile',
            icon: 'pi pi-user',
            routerLink: '/profile',
          },
          {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
              this.handleLogout();
            },
          },
        ],
      },
    ];
  }

  private handleLogout(): void {
    this.authService.logout();
  }

  navigateToProfile() {
    this.router.navigate(['/profile']); // Adjust '/profile' to match your route
  }
}
