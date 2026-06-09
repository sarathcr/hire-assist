import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { GlobalFocusTrapService } from './shared/services/global-focus-trap.service';

import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'hire-assist-fe';

  constructor(
    private globalFocusTrapService: GlobalFocusTrapService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.globalFocusTrapService.init();
    if (this.authService.isAuthenticated()) {
      this.authService.silentRefresh().subscribe();
    }
  }
}
