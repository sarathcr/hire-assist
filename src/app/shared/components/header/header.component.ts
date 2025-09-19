import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { DropDownComponent } from '../drop-down/drop-down.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, DropDownComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(public router: Router) {}

  toggleMenu = inject(ToggleMenuService);

  public onMenuClick() {
    this.toggleMenu.setToggleMenu(true);
  }
}
