import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, signal, viewChild, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';
import { DropdownManagerService } from '../../services/dropdown-manager.service';

@Component({
  selector: 'app-drop-down',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './drop-down.component.html',
  styleUrl: './drop-down.component.scss',
})
export class DropDownComponent implements OnInit {
  items: MenuItem[] | undefined;
  showMenu = signal(false);
  userName = signal('');
  userRole = signal('');
  profileImageUrl = signal<string | undefined>(undefined);
  
  dropdownEl = viewChild<ElementRef>('dropdown');

  private destroyRef = inject(DestroyRef);
  private dropdownManager = inject(DropdownManagerService);

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeService: StoreService,
  ) {}

  ngOnInit() {
    this.storeService.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      const userData = state.userState;
      this.userName.set(userData?.name || 'User');
      this.profileImageUrl.set(userData?.profileImageUrl);

      const roles = this.storeService.getUserRole();
      this.userRole.set(roles && roles.length > 0 ? roles.join(', ') : 'Guest');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.dropdownEl()?.nativeElement.contains(event.target)) {
      this.showMenu.set(false);
      this.dropdownManager.closeActive();
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    const willOpen = !this.showMenu();
    if (willOpen) {
      const target = (event.currentTarget || event.target) as HTMLElement;
      this.dropdownManager.registerOpen(
        {
          hide: () => this.showMenu.set(false),
          container: this.dropdownEl()?.nativeElement,
          target,
        },
        target,
      );
    } else {
      this.dropdownManager.closeActive();
    }
    this.showMenu.set(willOpen);
  }

  handleLogout(): void {
    this.showMenu.set(false);
    this.dropdownManager.closeActive();
    this.authService.logout();
  }

  navigateToProfile() {
    this.showMenu.set(false);
    this.dropdownManager.closeActive();
    this.router.navigate(['/profile']);
  }
}
