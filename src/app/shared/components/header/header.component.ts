import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { DropDownComponent } from '../drop-down/drop-down.component';
import { SidebarCollapseService } from '../../services/sidebar-collapse.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, DropDownComponent, SkeletonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(public router: Router) {}

  toggleMenu = inject(ToggleMenuService);
  sidebarCollapse = inject(SidebarCollapseService);
  storeService = inject(StoreService);
  private destroy$ = new Subject<void>();
  public isMobile = false;
  public profileImageUrl: string | undefined;
  public isLoadingProfileImage = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  ngOnInit() {
    this.checkMobileView();
    this.loadProfileImage();
    // Subscribe to state changes to update profile image when it changes
    this.storeService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.profileImageUrl = state.userState.profileImageUrl;
        this.isLoadingProfileImage = state.userState.isLoadingProfileImage || false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfileImage(): void {
    this.profileImageUrl = this.storeService.getProfileImageUrl();
    this.isLoadingProfileImage = this.storeService.getIsLoadingProfileImage();
  }

  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'avatar.png';
    }
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  public onMenuClick() {
    // On mobile/tablet, only toggle the menu overlay
    // On desktop, also toggle collapse
    if (this.isMobile) {
      this.toggleMenu.setToggleMenu(true);
    } else {
      this.toggleMenu.setToggleMenu(true);
      // Desktop collapse is handled separately via the collapse button
    }
  }

  public closeMenu() {
    this.toggleMenu.setToggleMenu(false);
  }

  public isMenuOpen(): boolean {
    return this.toggleMenu.getToggleMenu();
  }

  public toggleSidebarCollapse() {
    // Only allow collapse on desktop
    if (!this.isMobile) {
      this.sidebarCollapse.toggle();
    }
  }
}
