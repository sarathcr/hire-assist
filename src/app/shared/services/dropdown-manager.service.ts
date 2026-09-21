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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.pointerdownListener = this.handlePointerDown.bind(this);
      this.keydownListener = this.handleKeydown.bind(this);
      document.addEventListener('pointerdown', this.pointerdownListener, true);
      document.addEventListener('keydown', this.keydownListener, true);
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
    }
  }
}
