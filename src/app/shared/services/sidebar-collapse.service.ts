import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarCollapseService {
  private collapsed = signal(false);

  public isCollapsed(): boolean {
    return this.collapsed();
  }

  public toggle(): void {
    this.collapsed.update((v) => !v);
  }

  public set(state: boolean): void {
    this.collapsed.set(state);
  }
}


