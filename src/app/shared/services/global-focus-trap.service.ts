import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class GlobalFocusTrapService implements OnDestroy {
  private keydownListener: (event: KeyboardEvent) => void;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.keydownListener = this.handleKeydown.bind(this);
  }

  public init(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('keydown', this.keydownListener, true); // use capture phase
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('keydown', this.keydownListener, true);
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const activeMasks = Array.from(document.querySelectorAll('.p-dialog-mask')).filter(
      mask => window.getComputedStyle(mask).display !== 'none' && window.getComputedStyle(mask).visibility !== 'hidden'
    );

    if (activeMasks.length === 0) {
      return;
    }

    // Get the topmost active mask
    const activeMask = activeMasks[activeMasks.length - 1];
    const activeDialog = activeMask.querySelector('.p-dialog') || activeMask;

    const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    
    const focusableElements = Array.from(activeDialog.querySelectorAll(focusableSelectors)).filter((el: Element) => {
      const htmlEl = el as HTMLElement;
      return (htmlEl.offsetWidth > 0 || htmlEl.offsetHeight > 0 || htmlEl.getClientRects().length > 0) &&
             !htmlEl.classList.contains('p-hidden-accessible') &&
             !htmlEl.classList.contains('p-hidden-focusable');
    }) as HTMLElement[];

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const isFocusInsideDialog = activeDialog.contains(document.activeElement);

    if (!isFocusInsideDialog) {
      event.preventDefault();
      firstElement.focus();
    } else if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
