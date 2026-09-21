import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { GlobalFocusTrapService } from './shared/services/global-focus-trap.service';
import { AuthService } from './shared/services/auth.service';
import { DialogService } from 'primeng/dynamicdialog';
import { DropdownManagerService } from './shared/services/dropdown-manager.service';

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
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService,
    private dropdownManager: DropdownManagerService,
  ) {}

  ngOnInit() {
    this.globalFocusTrapService.init();
    if (this.authService.isAuthenticated()) {
      this.authService.silentRefresh().subscribe();
    }

    // Close all open dynamic dialogs and active dropdowns on route navigation (e.g. browser back button)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dropdownManager.closeActive();
        if (this.dialogService.dialogComponentRefMap) {
          this.dialogService.dialogComponentRefMap.forEach((dialogRef) => {
            dialogRef.destroy();
          });
        }
      }
    });
  }
}
