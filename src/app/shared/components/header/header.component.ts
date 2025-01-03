import { Component, inject, output } from '@angular/core';
import { ToggleMenuService } from '../../services/toggle-menu.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  public menuOpen = output<boolean>();
  toggleMenu = inject(ToggleMenuService);

  public onMenuClick() {
    this.toggleMenu.setToggleMenu(true);
  }
}
