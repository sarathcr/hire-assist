import { Injectable } from '@angular/core';
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

  constructor(public dialog: DialogService) {}

  public checkDeviceWidth(): Observable<boolean> {
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
      return of(false); // Indicating that the device width is not sufficient
    }
    return of(true); // Indicating that the device width is sufficient
  }

  private getDeviceWarningDialogData(): DialogData {
    return {
      message: `You cannot attend the assessment test from mobile devices. You should at least have a laptop or higher devices.`,
      isChoice: true,
      closeOnNavigation: true,
    };
  }
}
