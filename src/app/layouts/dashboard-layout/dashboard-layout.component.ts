import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SideNavComponent } from '../../shared/components/side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [SideNavComponent, HeaderComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent {}
