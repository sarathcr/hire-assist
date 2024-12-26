import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterOutlet } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { FullscreenLayoutComponent } from './layouts/fullscreen-layout/fullscreen-layout.component';
import { PageLayout } from './shared/enum/enum';
import { PageLayoutService } from './shared/services/page-layout.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    DashboardLayoutComponent,
    FullscreenLayoutComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly PageLayout = PageLayout;

  constructor(public pageLayoutService: PageLayoutService) {}
}