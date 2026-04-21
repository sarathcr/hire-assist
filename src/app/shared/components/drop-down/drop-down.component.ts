import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';

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
  
  dropdownEl = viewChild<ElementRef>('dropdown');

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeService: StoreService,
  ) {}
  ngOnInit() {
    const userData = this.storeService.getUserData();
    this.userName.set(userData?.name || 'User');
    
    const roles = this.storeService.getUserRole();
    this.userRole.set(roles && roles.length > 0 ? roles.join(', ') : 'Guest');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.dropdownEl()?.nativeElement.contains(event.target)) {
      this.showMenu.set(false);
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.showMenu.update((v) => !v);
  }

  handleLogout(): void {
    this.showMenu.set(false);
    this.authService.logout();
  }

  navigateToProfile() {
    this.showMenu.set(false);
    this.router.navigate(['/profile']);
  }
}
