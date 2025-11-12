import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RippleModule } from 'primeng/ripple';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { SidebarCollapseService } from '../../services/sidebar-collapse.service';

@Component({
  selector: 'app-side-nav',
  imports: [
    MenuModule,
    BadgeModule,
    RippleModule,
    AvatarModule,
    CommonModule,
    PanelMenuModule,
  ],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent implements OnChanges, OnInit {
  public items: MenuItem[] | undefined;
  public toggleMenu = inject(ToggleMenuService);
  public showMenu = computed(() => this.toggleMenu.getToggleMenu());
  private collapseService = inject(SidebarCollapseService);
  public collapsed = computed(() => this.collapseService.isCollapsed());
  public navLinkInterceptor: MenuItem[] = [];
  public mainNavLinks: MenuItem[] = [];
  public bottomNavLinks: MenuItem[] = [];
  @Input() public navLinks: MenuItem[] | undefined;
  private cdr = inject(ChangeDetectorRef);
  public isMobile = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  constructor() {
    // Watch for collapse state changes and update tooltip classes
    effect(() => {
      const isCollapsed = this.collapsed();
      // Use setTimeout to ensure change detection runs after state update
      setTimeout(() => {
        if (!this.isMobile) {
          this.updateTooltipClasses(isCollapsed);
        }
        this.cdr.detectChanges();
      }, 0);
    });
  }

  ngOnInit(): void {
    this.checkMobileView();
  }

  public isMobileView(): boolean {
    return this.isMobile;
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['navLinks'] && changes['navLinks']?.currentValue) {
      const currentNavLinks: MenuItem[] = JSON.parse(
        JSON.stringify(this.navLinks),
      );
      this.onNavLinkClick(currentNavLinks);
      this.navLinkInterceptor = currentNavLinks;

      // Split Settings to bottom section
      const settingsIndex = currentNavLinks.findIndex(
        (l) => (l?.label || '').toLowerCase() === 'settings',
      );
      if (settingsIndex > -1) {
        const settings = currentNavLinks.splice(settingsIndex, 1)[0];
        this.bottomNavLinks = [settings];
      } else {
        this.bottomNavLinks = [];
      }
      this.mainNavLinks = currentNavLinks;
      // Update tooltip classes after navLinks are set
      setTimeout(() => {
        this.updateTooltipClasses(this.collapsed());
        this.cdr.detectChanges();
      }, 0);
    }
  }
  // Public methods
  public closeToggleMenu() {
    this.toggleMenu.setToggleMenu(false);
  }
  public toggleCollapse() {
    this.collapseService.toggle();
  }
  private onNavLinkClick(links: MenuItem[]) {
    for (const link of links) {
      if (link.routerLink && link['hasRouterLink'] !== false) {
        link.command = () => {
          this.closeToggleMenu();
        };
      }
      if (link.items && link.items.length > 0) {
        this.onNavLinkClick(link.items);
      }
    }
  }

  private updateTooltipClasses(isCollapsed: boolean) {
    const tooltipClass = isCollapsed
      ? 'sidebar-tooltip'
      : 'sidebar-tooltip-hide';
    this.updateTooltipClassRecursive(
      this.mainNavLinks,
      tooltipClass,
      isCollapsed,
    );
    this.updateTooltipClassRecursive(
      this.bottomNavLinks,
      tooltipClass,
      isCollapsed,
    );

    // Force array reference change to trigger PrimeNG re-render
    this.mainNavLinks = [...this.mainNavLinks];
    this.bottomNavLinks = [...this.bottomNavLinks];
  }

  private updateTooltipClassRecursive(
    links: MenuItem[],
    tooltipClass: string,
    isCollapsed: boolean,
  ) {
    for (const link of links) {
      // Store original tooltip text if not already stored (use existing tooltip or label)
      if (!link['_originalTooltip']) {
        link['_originalTooltip'] = link.tooltip || link.label || '';
      }

      if (isCollapsed && link['_originalTooltip']) {
        // Show tooltip when collapsed
        link.tooltip = link['_originalTooltip'];
        link.tooltipOptions = {
          tooltipPosition: 'right',
          tooltipEvent: 'hover',
          tooltipStyleClass: tooltipClass,
        };
      } else {
        // Hide tooltip when expanded - remove tooltip property
        delete link.tooltip;
        if (link.tooltipOptions) {
          link.tooltipOptions.tooltipStyleClass = tooltipClass;
        }
      }

      if (link.items && link.items.length > 0) {
        this.updateTooltipClassRecursive(link.items, tooltipClass, isCollapsed);
      }
    }
  }
}
