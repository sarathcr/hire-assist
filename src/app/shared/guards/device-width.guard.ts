import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DeviceWarningService } from '../services/device-width.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceWidthGuard implements CanActivate {
  constructor(
    private deviceWarningService: DeviceWarningService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> | boolean {
    return new Observable<boolean>((observer) => {
      this.deviceWarningService.checkDeviceWidth().subscribe((canNavigate) => {
        if (!canNavigate) {
          observer.next(false);
          observer.complete();
        } else {
          observer.next(true);
          observer.complete();
        }
      });
    });
  }
}
