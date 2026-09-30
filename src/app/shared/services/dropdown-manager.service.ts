import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface DropdownInstance {
  hide: () => void;
  container?: HTMLElement | Element | null;
  target?: HTMLElement | Element | null;
  el?: { nativeElement?: HTMLElement };
  overlayVisible?: boolean;
  visible?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DropdownManagerService implements OnDestroy {
  private activeDropdown: DropdownInstance | null = null;
  private pointerdownListener?: (event: MouseEvent | PointerEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;
  private scrollListener?: (event: Event) => void;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.pointerdownListener = this.handlePointerDown.bind(this);
      this.keydownListener = this.handleKeydown.bind(this);
      this.scrollListener = this.handleScroll.bind(this);
      document.addEventListener('pointerdown', this.pointerdownListener, true);
      document.addEventListener('keydown', this.keydownListener, true);
      window.addEventListener('scroll', this.scrollListener, true);
    }
  }

  public registerOpen(
    dropdown: DropdownInstance,
    trigger?: HTMLElement | Element,
  ): void {
    if (this.activeDropdown && this.activeDropdown !== dropdown) {
      this.closeActive();
    }
    if (trigger && !dropdown.target) {
      dropdown.target = trigger;
    }
    this.activeDropdown = dropdown;
  }

  public toggleMenu(menu: any, event: Event, triggerBtn?: any): void {
    if (!menu) {
      return;
    }

    event?.stopPropagation?.();
    event?.preventDefault?.();

    // 1. Resolve button element
    let targetEl: HTMLElement | null = null;
    if (triggerBtn?.el?.nativeElement) {
      targetEl =
        triggerBtn.el.nativeElement.querySelector('button') ||
        triggerBtn.el.nativeElement;
    } else if (triggerBtn instanceof HTMLElement) {
      targetEl = triggerBtn;
    }

    if (!targetEl && event) {
      const raw = (event.currentTarget || event.target) as HTMLElement;
      targetEl = raw?.closest
        ? (raw.closest('button, .p-button') as HTMLElement) || raw
        : raw;
    }

    // 2. Register open in dropdownManager
    this.registerOpen(menu, targetEl || undefined);

    if (targetEl) {
      menu.target = targetEl;
    }

    // 3. Wrap alignOverlay to prevent Safari null target bug and upward flipping to top: 0
    if (menu && typeof menu.alignOverlay === 'function' && !menu._alignOverlayWrapped) {
      menu._alignOverlayWrapped = true;
      const originalAlign = menu.alignOverlay.bind(menu);
      menu.alignOverlay = () => {
        if (!menu.target && targetEl) {
          menu.target = targetEl;
        }
        originalAlign();

        if (menu.container && menu.target) {
          const anchor = (menu.target as any)?.nativeElement || menu.target;
          const container = (menu.container as any)?.nativeElement || menu.container;
          if (anchor?.getBoundingClientRect && container?.style) {
            const anchorRect = anchor.getBoundingClientRect();
            const windowScrollTop =
              window.pageYOffset || document.documentElement.scrollTop || 0;
            const windowScrollLeft =
              window.pageXOffset || document.documentElement.scrollLeft || 0;

            const currentTop = parseFloat(container.style.top || '0');
            const buttonTop = anchorRect.top + windowScrollTop;
            const buttonBottom = anchorRect.bottom + windowScrollTop;

            // If menu was positioned above the button or at the top of page (e.g. 0px / touching header)
            if (currentTop < buttonTop - 5) {
              container.style.top = `${buttonBottom + 4}px`;
              container.style.transformOrigin = 'top';
            }

            // Align horizontally directly below the button:
            // Prefer aligning left edge of menu with left edge of button
            const viewportWidth =
              window.innerWidth || document.documentElement.clientWidth;
            const containerWidth = container.offsetWidth || 220;
            let left = anchorRect.left + windowScrollLeft;
            if (left + containerWidth > viewportWidth - 10) {
              left = Math.max(10, anchorRect.right + windowScrollLeft - containerWidth);
            }
            container.style.left = `${left}px`;
            container.style.zIndex = '1200';
          }
        }
      };
    }

    // 4. Construct synthetic event ensuring currentTarget is preserved in Safari (WebKit)
    const syntheticEvent = {
      ...event,
      currentTarget: targetEl,
      target: targetEl,
      preventDefault: () => event?.preventDefault?.(),
      stopPropagation: () => event?.stopPropagation?.(),
    };

    menu.toggle(syntheticEvent);

    if (targetEl) {
      menu.target = targetEl;
    }
  }

  public registerClose(dropdown: DropdownInstance): void {
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    }
  }

  public closeActive(): void {
    if (this.activeDropdown) {
      const current = this.activeDropdown;
      this.activeDropdown = null;
      try {
        current.hide();
      } catch (err) {
        console.error('Error closing dropdown', err);
      }
    }
  }

  public closeAll(): void {
    this.closeActive();
  }

  public getActive(): DropdownInstance | null {
    return this.activeDropdown;
  }

  private handlePointerDown(event: MouseEvent | PointerEvent): void {
    if (!this.activeDropdown) {
      return;
    }

    const clickedTarget = event.target as Node | null;
    if (!clickedTarget) {
      return;
    }

    const dropdown = this.activeDropdown;
    const container =
      dropdown.container ||
      (dropdown.el?.nativeElement?.querySelector(
        '.p-popover, .p-menu, .dropdown__flyout',
      ) as HTMLElement | null) ||
      (document.querySelector(
        '.p-popover:not(.p-popover-leave), .p-menu:not(.p-menu-leave)',
      ) as HTMLElement | null);
    const containerEl = (container as any)?.nativeElement || container;

    const trigger = dropdown.target;
    const triggerEl = (trigger as any)?.nativeElement || trigger;
    const buttonEl = triggerEl?.closest
      ? triggerEl.closest('button, .p-button, .dropdown__trigger') || triggerEl
      : triggerEl;

    // If clicking inside the active dropdown container, allow it
    if (containerEl && containerEl.contains(clickedTarget)) {
      return;
    }

    // If clicking the active dropdown's own trigger button, allow toggle handler to handle closing
    if (
      buttonEl &&
      (buttonEl === clickedTarget || buttonEl.contains(clickedTarget))
    ) {
      return;
    }

    // Outside click (or click on another dropdown trigger) -> close the active dropdown immediately
    this.closeActive();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.activeDropdown) {
      this.closeActive();
    }
  }

  private handleScroll(event: Event): void {
    if (!this.activeDropdown) {
      return;
    }

    const scrollTarget = event.target as Node | null;
    if (!scrollTarget) {
      return;
    }

    const dropdown = this.activeDropdown;
    const container =
      dropdown.container ||
      (dropdown.el?.nativeElement?.querySelector(
        '.p-popover, .p-menu, .dropdown__flyout',
      ) as HTMLElement | null) ||
      (document.querySelector(
        '.p-popover:not(.p-popover-leave), .p-menu:not(.p-menu-leave)',
      ) as HTMLElement | null);
    const containerEl = (container as any)?.nativeElement || container;

    // If scrolling inside the active dropdown container itself (e.g. scrolling menu items), do not close
    if (containerEl && (containerEl === scrollTarget || containerEl.contains(scrollTarget))) {
      return;
    }

    // Outside scroll (e.g. page or main container scroll) -> close active dropdown immediately
    this.closeActive();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.pointerdownListener) {
        document.removeEventListener(
          'pointerdown',
          this.pointerdownListener,
          true,
        );
      }
      if (this.keydownListener) {
        document.removeEventListener('keydown', this.keydownListener, true);
      }
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener, true);
      }
    }
  }
}
