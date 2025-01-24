import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { FullscreenLayoutComponent } from './layouts/fullscreen-layout/fullscreen-layout.component';
import { PageLayout } from './shared/enum/enum';
import { PageLayoutService } from './shared/services/page-layout.service';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    DashboardLayoutComponent,
    AuthLayoutComponent,
    FullscreenLayoutComponent,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly PageLayout = PageLayout;

  constructor(public pageLayoutService: PageLayoutService) {}
}
