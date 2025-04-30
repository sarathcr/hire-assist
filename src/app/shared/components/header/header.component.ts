import { CommonModule } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { DropDownComponent } from '../drop-down/drop-down.component';
import { Router } from '@angular/router';
import { ToggleMenuService } from '../../services/toggle-menu.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, DropDownComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(public router: Router) {}

  public menuOpen = output<boolean>();
  toggleMenu = inject(ToggleMenuService);

  public onMenuClick() {
    this.toggleMenu.setToggleMenu(true);
  }
}
