import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, of } from 'rxjs';
import { DialogComponent } from '../components/dialog/dialog.component';
import { DialogData } from '../models/dialog-models';
import { DialogFooterComponent } from '../components/dialog-footer/dialog-footer.component';

@Injectable({
  providedIn: 'root',
})
export class DeviceWarningService {
  private readonly MIN_WIDTH = 1024;
  public ref: DynamicDialogRef | undefined;

  constructor(
    public dialog: DialogService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  public checkDeviceWidth(): Observable<boolean> {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      const modalData: DialogData = this.getDeviceWarningDialogData();

      if (width < this.MIN_WIDTH) {
        this.ref = this.dialog.open(DialogComponent, {
          data: modalData,
          header: 'Sorry',
          width: '50vw',
          modal: true,
          breakpoints: {
            '960px': '75vw',
            '640px': '90vw',
          },
          templates: {
            footer: DialogFooterComponent,
          },
        });
        return of(false); // Device width is not sufficient
      }
      return of(true); // Device width is sufficient
    }
    // Default response for non-browser platforms
    return of(true);
  }

  private getDeviceWarningDialogData(): DialogData {
    return {
      message: `You cannot attend the assessment test from mobile devices. You should at least have a laptop or higher devices.`,
      isChoice: false,
      closeOnNavigation: true,
      acceptButtonText: 'OK',
    };
  }
}
