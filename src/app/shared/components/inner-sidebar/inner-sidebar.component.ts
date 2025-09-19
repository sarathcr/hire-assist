import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-inner-sidebar',
  imports: [Menu, RouterLink, ButtonModule, NgClass],
  templateUrl: './inner-sidebar.component.html',
  styleUrl: './inner-sidebar.component.scss',
})
export class InnerSidebarComponent extends BaseComponent {
  public showMenu = true;

  public activeMenuItem = input<number>();
  public items = input<MenuItem[]>();
}
