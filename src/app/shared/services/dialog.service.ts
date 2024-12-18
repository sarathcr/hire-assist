import { DialogConfig } from '@angular/cdk/dialog';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(public dialog: MatDialog) {
  }

  openDialog(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: any,
    config?: DialogConfig
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Observable<any> {
    console.log('hiii');

    const width = config ? config.width : 'auto';
    const dialogRef = this.dialog.open(component, {
      data: data,
      autoFocus: false,
      disableClose: true,
      width,
    });

    return dialogRef.afterClosed().pipe(
      map(response => {
        return response;
      })
    );
  }
}
