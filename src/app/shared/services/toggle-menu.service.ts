import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToggleMenuService {
  private toggleMenu = signal(false);

  public setToggleMenu(state: boolean) {
    this.toggleMenu.set(state);
  }

  public getToggleMenu() {
    return this.toggleMenu();
  }
}
